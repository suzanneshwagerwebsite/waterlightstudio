# Remaining setup (2 steps, ~3 minutes)

Everything else is done and the live site is fixed. These two steps need your
GitHub/Cloudflare login, which the agent cannot access. After them, every push
to `main` auto-publishes reliably and you never have to think about syncing again.

## 1. Push the commits to GitHub

```
cd /Users/danielcarrera/waterlightstudio
git push origin main
```

Pushes 3 commits: save-path hardening, the `.assetsignore` security fix, and the
GitHub Actions deploy workflow.

## 2. Add two GitHub repo secrets (for the Actions workflow)

a. Create a Cloudflare API token:
   https://dash.cloudflare.com/profile/api-tokens -> Create Token ->
   use the "Edit Cloudflare Workers" template -> Continue -> Create Token -> copy it.

b. In GitHub: repo Settings -> Secrets and variables -> Actions -> New repository secret.
   Add both:
   - Name: `CLOUDFLARE_API_TOKEN`   Value: (the token from step a)
   - Name: `CLOUDFLARE_ACCOUNT_ID`  Value: `924476770d90ac3ac157044f7ed526ab`

That's it. The next push (or re-run the "Deploy to Cloudflare" workflow from the
Actions tab) will deploy both workers automatically. Watch for the green check on
the commit.

## Optional cleanup once Actions is confirmed working

The old Cloudflare dashboard build integration on the `waterlightstudio` Worker
(Settings -> Builds) is what silently broke. Once the Actions workflow is green,
you can disconnect that dashboard build so there's only one publish path. Not
urgent; they coexist fine.

## What was wrong (for the record)

Your uploads were always saving to GitHub. The live site stopped auto-publishing
around 2026-06-01 because the dashboard build ran `wrangler versions upload`
(stages a version, does not route live traffic) and your Cloudflare login had
expired. ~42 commits of work were stuck in GitHub but never went live. All of it
is now live, and the Actions workflow above prevents a recurrence.
