# allneeds Cloudflare backend

This directory is the repository-owned source for the **API only**. The React site remains hosted by GitHub Pages. Do not configure Cloudflare Pages to host the frontend.

Production target:

- Worker: `allneeds-backend`
- Custom domain: `https://backend.allneeds.app`
- D1 binding: `DB`
- D1 database: `allneeds-db`

## Why this lives in `backend/`

Cloudflare should be connected with this directory as the Worker root so frontend commits do not build/deploy the Worker. Preview builds should stay off unless there is a deliberate backend-preview need. Once Git integration is enabled, configure the build watch path so only `backend/**` changes trigger the Worker pipeline.

The frontend continues to deploy independently through `.github/workflows/pages.yml`.

## One-time Cloudflare values

`wrangler.jsonc` intentionally contains:

```text
REPLACE_WITH_ALLNEEDS_DB_ID
```

Before the first deployment, replace that placeholder with the database ID shown for `allneeds-db` in Cloudflare D1. Do not create a second database.

The Worker also supports an `ADMIN_DIDS` environment variable. It is a comma-separated allowlist of verified Bluesky DIDs that may hide/restore community strategies. Do not populate it with a handle or a guessed DID. Add an admin DID only after the backend OAuth flow has authenticated that profile and `/api/me` reports `verified: true`.

## Deployment order

The backend and frontend auth cutover must not be deployed in the wrong order.

1. Back up/inspect the existing `allneeds-db` schema.
2. Apply `migrations/0001_strategy_ownership.sql`.
3. Apply `migrations/0002_backend_oauth.sql`.
4. Replace the D1 database-id placeholder in `wrangler.jsonc`.
5. Install dependencies from this directory.
6. Run the Worker dry-run check.
7. Deploy `allneeds-backend` and verify:
   - `/api/health`
   - `/oauth-client-metadata.json`
   - the existing public strategy feed
   - existing signed-out site behavior
8. Test the new `/auth/login` → `/auth/callback` flow before merging the frontend auth cutover.
9. After a verified profile is confirmed, add its DID to `ADMIN_DIDS` if that profile should have moderation privileges.
10. Only then merge/deploy the React changes that use verified backend login and stable strategy sync.

Keeping this order means the live GitHub Pages site never points at endpoints that have not been deployed yet.

## Authentication model

The former browser flow forwarded a DPoP-bound access token to `/auth/session` while separately asserting a DID. That endpoint is retained temporarily for compatibility, but sessions created through it are deliberately **unverified** and cannot use privileged owner/admin endpoints.

The replacement flow uses the official AT Protocol OAuth client in the Worker:

- `/auth/login` starts PKCE + DPoP OAuth and stores short-lived authorization state in D1;
- `/auth/callback` completes the OAuth exchange and obtains the DID from the verified OAuth result;
- the Worker creates its own HttpOnly `allneeds_session` with `verified_at` set;
- the temporary Bluesky OAuth credential is immediately revoked/deleted because allneeds only needs the verified identity for its own data.

Privileged ownership and moderation always require a verified allneeds session.

## Strategy ownership and moderation

The ownership migration adds:

- stable per-profile `client_key` values so edits update the same remote strategy instead of delete/recreate reconciliation;
- `updated_at`;
- `moderation_status` separate from the author's visibility;
- indexed normalized `strategy_needs` rows for need-specific public queries.

New/privileged endpoints include:

- `POST /api/strategies/sync-owned`
- `PATCH /api/strategies/:id`
- `DELETE /api/strategies/:id`
- `POST /api/admin/strategies/:id/hide`
- `POST /api/admin/strategies/:id/restore`
- `GET /api/strategies/feed?need=<need-slug>`

`Hide` removes a strategy from discovery without deleting it or rewriting the author's chosen visibility.

## Free-tier discipline

The Worker is only the dynamic API layer. Static application assets, bundled system strategies, icons, CSS, and JavaScript remain on GitHub Pages. The frontend warms one public community-strategy snapshot during its existing boot overlay and reuses it in memory; it must still open normally if the Worker is slow or unavailable.
