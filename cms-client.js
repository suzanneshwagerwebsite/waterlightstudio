(function (global) {
    'use strict';

    const CMS_DATA_URL = '/data/cms.json';
    const CMS_CACHE_KEY = 'wl_cms_data_cache_v1';
    const ADMIN_KEY_SESSION = 'cms_admin_key';

    const DEFAULT_CMS = {
        version: 1,
        updatedAt: new Date().toISOString(),
        settings: {
            sectionOrder: ['hero', 'products', 'feature', 'values', 'journal', 'newsletter'],
            showHeroSection: true,
            showProductsSection: true,
            showFeatureSection: true,
            showValuesSection: true,
            showJournalSection: true,
            showNewsletterSection: true,
            showAboutHero: true,
            showAboutOrigin: true,
            showAboutPrinciples: true,
            showAboutEngagement: true,
            showAboutCta: true,
            showGalleryFilters: true,
            showGalleryGrid: true
        },
        hero: { title: '', cta_text: '', cta_link: '', image: '', image_alt: '' },
        products: { section_title: '', items: [] },
        feature: { image: '', image_alt: '', title: '', description: '', link_text: '', link_url: '' },
        values: { title: '', items: [] },
        journal: { intro_text: '', cta_text: '', cta_link: '', cards: [] },
        newsletter: { signup_text: '', image: '', image_alt: '', instagram_text: '' },
        about: {
            kicker: '', hero_title: '', hero_description: '',
            origin_title: '', origin_text_1: '', origin_text_2: '',
            origin_image: '', origin_image_alt: '',
            principles: [], engagement: []
        },
        gallery: {
            kicker: '', hero_title: '', hero_description: '',
            categories: [], items: []
        },
        contact: {
            intro: "If you've got any questions regarding my work, sales or anything else please don't hesitate to get in touch. I'll try to get back to you as soon as possible.",
            intro_2: "If you'd like to arrange a studio visit please get in touch close to the time that you'd like to come, rather than months or weeks ahead."
        }
    };

    let memoryCms = null;
    let inFlight = null;

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function asArray(value, fallback) {
        return Array.isArray(value) ? value : fallback;
    }

    function mergeCms(input) {
        const cms = input && typeof input === 'object' ? input : {};
        return {
            version: typeof cms.version === 'number' ? cms.version : DEFAULT_CMS.version,
            updatedAt: typeof cms.updatedAt === 'string' ? cms.updatedAt : new Date().toISOString(),
            settings: { ...DEFAULT_CMS.settings, ...(cms.settings || {}) },
            hero: { ...DEFAULT_CMS.hero, ...(cms.hero || {}) },
            products: {
                section_title: (cms.products && cms.products.section_title) || DEFAULT_CMS.products.section_title,
                items: asArray(cms.products && cms.products.items, DEFAULT_CMS.products.items)
            },
            feature: { ...DEFAULT_CMS.feature, ...(cms.feature || {}) },
            values: {
                title: (cms.values && cms.values.title) || DEFAULT_CMS.values.title,
                items: asArray(cms.values && cms.values.items, DEFAULT_CMS.values.items)
            },
            journal: {
                intro_text: (cms.journal && cms.journal.intro_text) || DEFAULT_CMS.journal.intro_text,
                cta_text: (cms.journal && cms.journal.cta_text) || DEFAULT_CMS.journal.cta_text,
                cta_link: (cms.journal && cms.journal.cta_link) || DEFAULT_CMS.journal.cta_link,
                cards: asArray(cms.journal && cms.journal.cards, DEFAULT_CMS.journal.cards)
            },
            newsletter: { ...DEFAULT_CMS.newsletter, ...(cms.newsletter || {}) },
            about: {
                ...DEFAULT_CMS.about,
                ...(cms.about || {}),
                principles: asArray(cms.about && cms.about.principles, DEFAULT_CMS.about.principles),
                engagement: asArray(cms.about && cms.about.engagement, DEFAULT_CMS.about.engagement)
            },
            gallery: {
                ...DEFAULT_CMS.gallery,
                ...(cms.gallery || {}),
                categories: asArray(cms.gallery && cms.gallery.categories, DEFAULT_CMS.gallery.categories),
                items: asArray(cms.gallery && cms.gallery.items, DEFAULT_CMS.gallery.items)
            },
            contact: { ...DEFAULT_CMS.contact, ...(cms.contact || {}) }
        };
    }

    function readCachedCms() {
        try {
            const raw = localStorage.getItem(CMS_CACHE_KEY);
            if (!raw) return null;
            return mergeCms(JSON.parse(raw));
        } catch {
            return null;
        }
    }

    function writeCachedCms(cms) {
        try {
            localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(cms));
        } catch {
            // Ignore storage quota/privacy failures.
        }
    }

    async function fetchCms(options) {
        const opts = options || {};
        const force = !!opts.force;

        if (memoryCms && !force) {
            return deepClone(memoryCms);
        }

        if (inFlight && !force) {
            const result = await inFlight;
            return deepClone(result);
        }

        inFlight = (async () => {
            try {
                const response = await fetch(CMS_DATA_URL, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`Failed to fetch CMS data (${response.status})`);
                }
                const payload = await response.json();
                const merged = mergeCms(payload);
                memoryCms = merged;
                writeCachedCms(merged);
                return merged;
            } catch (error) {
                const cached = readCachedCms();
                if (cached) {
                    memoryCms = cached;
                    return cached;
                }
                memoryCms = deepClone(DEFAULT_CMS);
                return memoryCms;
            }
        })();

        try {
            const result = await inFlight;
            return deepClone(result);
        } finally {
            inFlight = null;
        }
    }

    async function saveCmsViaWorker(cms, config) {
        const cfg = config || {};
        const workerUrl = (cfg.workerUrl || '').trim().replace(/\/$/, '');
        const adminKey = (cfg.adminKey || '').trim();

        if (!workerUrl) throw new Error('Missing Worker URL');
        if (!adminKey) throw new Error('Missing admin key');

        const body = {
            cms: mergeCms(cms),
            commitMessage: cfg.commitMessage || `cms: update ${new Date().toISOString()}`,
            files: Array.isArray(cfg.files) && cfg.files.length > 0 ? cfg.files : undefined
        };

        const response = await fetch(`${workerUrl}/cms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminKey}`
            },
            body: JSON.stringify(body)
        });

        const text = await response.text();
        let payload;
        try {
            payload = text ? JSON.parse(text) : {};
        } catch {
            payload = { error: text || 'Unknown response' };
        }

        if (!response.ok) {
            throw new Error(payload.error || `Save failed (${response.status})`);
        }

        const merged = mergeCms(body.cms);
        merged.updatedAt = payload.updatedAt || merged.updatedAt;
        memoryCms = merged;
        writeCachedCms(merged);
        return payload;
    }

    function getAdminKey() {
        return localStorage.getItem(ADMIN_KEY_SESSION) || '';
    }

    function setAdminKey(value) {
        localStorage.setItem(ADMIN_KEY_SESSION, value);
    }

    function clearAdminKey() {
        localStorage.removeItem(ADMIN_KEY_SESSION);
    }

    global.CMS = {
        CMS_DATA_URL,
        DEFAULT_CMS: deepClone(DEFAULT_CMS),
        mergeCms,
        fetchCms,
        saveCmsViaWorker,
        getAdminKey,
        setAdminKey,
        clearAdminKey,
        readCachedCms,
        writeCachedCms
    };
})(window);
