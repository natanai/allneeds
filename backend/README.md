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

`wrangler.jsonc` is configured with the existing `allneeds-db` database ID:

```text
d199693f-1549-4265-a298-b62ee68a0e3b
```

Before the first deployment, confirm that this still matches the database ID shown for `allneeds-db` in Cloudflare D1. Do not create a second database.

## Confirmed production-schema preflight

The existing production schema was inspected read-only on 2026-08-25. It matches the migration's legacy assumptions:

- `strategies` has `visibility`, `add_count`, `need_ids`, and `created_at`, but not `client_key`, `updated_at`, or `moderation_status`;
- `sessions` has the legacy token/session fields, but not `verified_at`;
- `strategy_needs`, `oauth_states`, and `oauth_sessions` do not exist yet;
- none of the new index names conflict with an existing production index.

Both migrations were then applied successfully to a local D1 fixture with that exact table/index shape. Existing strategy/session rows were preserved, `updated_at` was backfilled from `created_at`, Need IDs were normalized into `strategy_needs`, malformed legacy Need JSON was skipped safely, and `PRAGMA quick_check` returned `ok`.

Migration `0001_strategy_ownership.sql` contains one-time `ALTER TABLE` statements and must not be applied twice. Check Cloudflare's D1 migration history/current schema before any retry after a partial or uncertain production run.

## Production migration status

Both migrations were applied to the existing production `allneeds-db` on 2026-08-25 after capturing a Time Travel bookmark and a full SQL export. Do **not** apply either migration again.

- pre-migration Time Travel bookmark: `000000c1-00000000-000050d2-78ef86bd72b3d2a7832060349c18998f`
- post-migration Time Travel bookmark: `000000c1-0000000e-000050d2-99b5a69ac695458c579d17c3d391ff88`
- local, gitignored export: `backend/.wrangler/backups/allneeds-db-before-ownership-2026-08-25.sql`
- final verification: 4 existing strategies preserved, 22 normalized Need links, empty OAuth tables, clean foreign-key check, and `PRAGMA quick_check = ok`
- legacy Worker verification after migration: `/api/health` and the existing public strategy feed both returned HTTP 200

Only the D1 schema was changed. The replacement Worker and React frontend have not been deployed.

The Worker supports these Cloudflare environment variables:

- `ADMIN_DIDS`: comma-separated allowlist of **verified** Bluesky DIDs that may hide/restore community strategies. Do not populate it with a handle or a guessed DID. Add an admin DID only after the backend OAuth flow has authenticated that profile and `/api/me` reports `verified: true`.
- `ALLOW_LEGACY_AUTH`: temporary cutover switch. Set exactly `1` only while the old browser-OAuth frontend still needs `/auth/session`. Remove it (or set anything other than `1`) as part of the React auth cutover. With the switch off, `/auth/session` is disabled and private `/api/*` operations reject old unverified sessions.

`ALLOW_LEGACY_AUTH=1` deliberately preserves the previous security boundary for a short staging window; it is not the intended steady state.

`wrangler.jsonc` sets `keep_vars: true` so repository deployments do not erase dashboard-managed values such as `ALLOW_LEGACY_AUTH` or the future verified `ADMIN_DIDS` allowlist. Those values must still be reviewed in Cloudflare before each deployment.

## Deployment order

The backend and frontend auth cutover must not be deployed in the wrong order.

Steps 1-4 were completed on 2026-08-25. Resume at step 5 only when a controlled backend deployment is authorized.

1. Capture the current `allneeds-db` Time Travel bookmark and export the remote database before changing its schema.
2. Apply `migrations/0001_strategy_ownership.sql`.
3. Apply `migrations/0002_backend_oauth.sql`.
4. Verify that the configured D1 database ID still matches the existing `allneeds-db` database.
5. During the backend-first staging window only, set `ALLOW_LEGACY_AUTH=1` so the currently live GitHub Pages frontend keeps working while the replacement login is tested.
6. From the repository root, run `pnpm install --frozen-lockfile`.
7. Run `pnpm --dir backend check` and confirm the dry-run reports `env.DB (allneeds-db)`.
8. Deploy `allneeds-backend` and verify:
   - `/api/health`
   - `/oauth-client-metadata.json`
   - the existing public strategy feed
   - existing signed-out site behavior
   - the old live frontend still functions while `ALLOW_LEGACY_AUTH=1`
9. Test the new `/auth/login` → `/auth/callback` flow directly and confirm `/api/me` reports `verified: true` for that new session.
10. Add that verified DID to `ADMIN_DIDS` if the profile should have moderation privileges, then confirm `/api/me` reports `admin: true`.
11. Merge/deploy the React changes that use verified backend login and stable strategy sync.
12. Immediately remove `ALLOW_LEGACY_AUTH` (or set it to a value other than `1`) and confirm:
    - `POST /auth/session` is rejected;
    - an old unverified cookie cannot read/write private profile APIs;
    - the verified login can still save/load profile data and sync owned strategies.

Keeping this order lets the replacement backend be exercised before the frontend cutover without silently making the insecure compatibility path permanent.

## Authentication model

The former browser flow forwarded a DPoP-bound access token to `/auth/session` while separately asserting a DID. That endpoint remains only as a temporary staging compatibility path. Sessions created through it are deliberately **unverified** and can never use stable owner/admin endpoints. Once `ALLOW_LEGACY_AUTH` is removed, the endpoint itself and private API access from those unverified sessions are rejected.

The replacement flow uses the official AT Protocol OAuth client in the Worker:

- `/auth/login` starts PKCE + DPoP OAuth and stores short-lived authorization state in D1;
- `/auth/callback` completes the OAuth exchange and obtains the DID from the verified OAuth result;
- the Worker creates its own HttpOnly `allneeds_session` with `verified_at` set;
- the temporary Bluesky OAuth credential is immediately revoked/deleted because allneeds only needs the verified identity for its own data.

Privileged ownership and moderation always require a verified allneeds session. With the cutover switch off, ordinary private profile APIs require that verified session as well.

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


