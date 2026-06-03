export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(env) });
        }

        const url = new URL(request.url);
        if (url.pathname !== '/cms') {
            return json({ error: 'Not found' }, 404, env);
        }

        if (request.method === 'GET') {
            return handleGet(env);
        }

        if (request.method === 'POST') {
            return handlePost(request, env);
        }

        return json({ error: 'Method not allowed' }, 405, env);
    }
};

async function handleGet(env) {
    try {
        const file = await readCmsFile(env);
        return json({ ok: true, cms: file.cms, sha: file.sha }, 200, env);
    } catch (error) {
        return json({ error: error.message || 'Failed to read cms.json' }, 500, env);
    }
}

async function handlePost(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token || token !== env.ADMIN_KEY) {
        return json({ error: 'Unauthorized' }, 401, env);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return json({ error: 'Invalid JSON body' }, 400, env);
    }

    const cms = payload && payload.cms;
    if (!isValidCmsPayload(cms)) {
        return json({ error: 'Invalid CMS payload schema' }, 422, env);
    }

    // Reject HEIC/HEIF up front: they commit fine but do not render in browsers,
    // so they look like a failed upload. The admin converts to JPEG client-side;
    // anything HEIC reaching here is an error worth surfacing, not silently storing.
    const files = Array.isArray(payload.files) ? payload.files : [];
    for (const file of files) {
        if (file && file.path && /\.(heic|heif)$/i.test(file.path)) {
            return json({ error: `HEIC/HEIF images are not supported (${file.path}). Please upload a JPEG or PNG.` }, 422, env);
        }
    }

    // Upload any attached files to the repo. Track anything we skip so the client
    // is never told "saved" while an image was silently dropped. base64 is ~33%
    // larger than the raw bytes, so the 20MB base64 cap is roughly a 15MB photo.
    const skipped = [];
    try {
        for (const file of files) {
            if (!file.path || !file.base64) { skipped.push({ path: file && file.path, reason: 'missing path or data' }); continue; }
            if (!file.path.startsWith('assets/img/')) { skipped.push({ path: file.path, reason: 'path not under assets/img/' }); continue; }
            if (file.base64.length > 20 * 1024 * 1024) { skipped.push({ path: file.path, reason: 'too large (use a photo under ~15MB)' }); continue; }

            const sha = await getFileSha(env, file.path);
            await writeGitHubFile(env, file.path, file.base64, sha, `cms: upload ${file.path}`);
        }
    } catch (error) {
        // An image PUT failed (GitHub 409/rate-limit/network). Surface a parseable
        // JSON error instead of an opaque 500 so the client can retry cleanly. The
        // image writes are idempotent (getFileSha), so a retry self-heals.
        return json({ error: `Image upload failed: ${error.message || 'unknown error'}` }, 502, env);
    }

    try {
        const existing = await readCmsFile(env);
        const normalized = {
            ...cms,
            updatedAt: new Date().toISOString()
        };

        const commitMessage =
            payload.commitMessage || `cms: update ${normalized.updatedAt}`;

        const commit = await writeCmsFile(env, {
            content: normalized,
            sha: existing.sha,
            message: commitMessage
        });

        // Belt-and-suspenders: force the Static Assets Worker to redeploy even if
        // the GitHub->Cloudflare build integration is broken. No-op if the secret
        // is unset. Never let a hook failure fail the save (the commit already landed).
        await triggerDeployHook(env);

        return json(
            {
                ok: true,
                commitSha: commit.commit?.sha || null,
                updatedAt: normalized.updatedAt,
                skipped
            },
            200,
            env
        );
    } catch (error) {
        return json({ error: error.message || 'Failed to write cms.json' }, 500, env);
    }
}

async function triggerDeployHook(env) {
    if (!env.DEPLOY_HOOK_URL) return;
    try {
        await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
    } catch (e) {
        // Deploy hook is a safety net; the commit is already saved. Swallow errors.
    }
}

function githubHeaders(env) {
    return {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'waterlightstudio-cms-worker',
        'Content-Type': 'application/json'
    };
}

function getRepoConfig(env) {
    return {
        owner: env.REPO_OWNER,
        repo: env.REPO_NAME,
        branch: env.REPO_BRANCH || 'main',
        path: env.CMS_PATH || 'data/cms.json'
    };
}

async function readCmsFile(env) {
    const cfg = getRepoConfig(env);
    const endpoint = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`;
    const response = await fetch(endpoint, { headers: githubHeaders(env) });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub read failed (${response.status}): ${text}`);
    }

    const payload = await response.json();
    const decoded = decodeBase64(payload.content || '');

    let cms;
    try {
        cms = JSON.parse(decoded);
    } catch {
        throw new Error('Existing cms.json is not valid JSON');
    }

    return { cms, sha: payload.sha };
}

async function writeGitHubFile(env, filePath, contentBase64, sha, message) {
    const cfg = getRepoConfig(env);
    const endpoint = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;

    const body = {
        message: message,
        content: contentBase64,
        branch: cfg.branch
    };
    if (sha) {
        body.sha = sha;
    }

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: githubHeaders(env),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub write failed for ${filePath} (${response.status}): ${text}`);
    }

    return response.json();
}

async function getFileSha(env, filePath) {
    const cfg = getRepoConfig(env);
    const endpoint = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${cfg.branch}`;
    const response = await fetch(endpoint, { headers: githubHeaders(env) });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.sha;
}

async function writeCmsFile(env, args) {
    const cfg = getRepoConfig(env);
    const contentBase64 = encodeBase64(JSON.stringify(args.content, null, 2) + '\n');
    return writeGitHubFile(env, cfg.path, contentBase64, args.sha, args.message);
}

function isValidCmsPayload(cms) {
    if (!cms || typeof cms !== 'object') return false;
    if (typeof cms.settings !== 'object' || cms.settings === null) return false;

    const requiredObjects = ['hero', 'feature', 'newsletter'];
    const requiredWithItems = ['products', 'values', 'journal', 'about', 'gallery'];

    if (!requiredObjects.every((key) => cms[key] && typeof cms[key] === 'object')) return false;
    if (!requiredWithItems.every((key) => cms[key] && typeof cms[key] === 'object')) return false;

    return true;
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decodeBase64(value) {
    const cleaned = value.replace(/\n/g, '');
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function corsHeaders(env) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}

function json(payload, status, env) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env)
        }
    });
}
