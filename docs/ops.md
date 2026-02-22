# Operations Runbook

## Access model

- GitHub repository owned by client account/org.
- Cloudflare Pages and DNS owned by client account.
- Developer access granted via collaborator/admin roles.

## Deployment flow

1. Push changes to `main`.
2. Cloudflare Pages automatically creates a production deployment.
3. Confirm deployment status in Cloudflare Pages dashboard.
4. Verify site on both apex and `www` domains.

## DNS and domain

- Current phase uses Cloudflare DNS with GoDaddy as registrar.
- Keep both apex and `www` active until canonical redirect decision is finalized.
- Preserve mail records when editing DNS (`MX`, SPF, DKIM, DMARC).

## Rollback

1. In Cloudflare Pages, open deployment history.
2. Promote the previous known-good deployment.
3. Confirm functional checks:
   - Home/About/Gallery routes
   - Contact mailto link
   - Gallery filter and lightbox

## Security and credentials

- Store critical credentials and recovery codes in shared password vault.
- Rotate credentials at handoff.
- Remove developer admin access after project transfer.
