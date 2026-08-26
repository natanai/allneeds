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

The first two migrations were applied to the existing production `allneeds-db` on 2026-08-25 after capturing a Time Travel bookmark and a full SQL export. Do **not** apply either migration again.

- pre-migration Time Travel bookmark: `000000c1-00000000-000050d2-78ef86bd72b3d2a7832060349c18998f`
- post-migration Time Travel bookmark: `000000c1-0000000e-000050d2-99b5a69ac695458c579d17c3d391ff88`
- local, gitignored export: `backend/.wrangler/backups/allneeds-db-before-ownership-2026-08-25.sql`
- final verification: 4 existing strategies preserved, 22 normalized Need links, empty OAuth tables, clean foreign-key check, and `PRAGMA quick_check = ok`
- legacy Worker verification after migration: `/api/health` and the existing public strategy feed both returned HTTP 200

The replacement Worker was deployed to production on 2026-08-25. The current contributor-aware version is `44e15d64-e417-4568-a97c-92b15356bbfd`; the original secure-cutover version is `2da0b258-2aa9-4ef9-925c-b322fe9c7b0e`, and the pre-cutover rollback version is `1eb3fa0a-d5d1-4eac-b08e-23f0ea3fd59b`. The feature-branch React frontend was manually deployed through the existing GitHub Pages workflow while PR #64 remained draft and unmerged.

The production Worker configuration is now repository-owned as well: `allneeds.app/auth/*`, `allneeds.app/api/*`, the `backend.allneeds.app` custom domain, observability, disabled preview URLs, `DB`, the explicit legacy-auth off value, and the verified admin DID are all explicit in `wrangler.jsonc`. Post-deployment checks passed for all three Worker routes, CORS, OAuth client metadata, signed-out `/api/me`, the public strategy feed, the signed-out live site, and the complete `/auth/login` → `/auth/callback` flow. That flow created a 30-day verified allneeds session for `nathanael.ink` / `did:plc:w23qsgdsux3neuguxfy7kvt5` and immediately removed the temporary Bluesky OAuth credential. The standard live-site login then reported `verified: true` and `admin: true`.

### Profile-owned Nat strategy status

The 40 former static strategies attributed to `Nat, Missouri` were migrated on 2026-08-25 to the verified profile `did:plc:w23qsgdsux3neuguxfy7kvt5`. Production verification confirmed 40 migrated records and clean database integrity. Their static catalog records, Need references, mapping manifest, and one-time preparation helper were subsequently removed from the repository; D1 profile storage is now their only current source.

Do not recreate repository copies of those profile-owned strategies. Migration `0003_strategy_contributors.sql` remains required schema history for reconstructing the production database and contains identifiers/attribution only, not strategy text.

### Strategy-contributor migration status

Migration `0003_strategy_contributors.sql` was applied once to production on 2026-08-25. It adds optional strategy-level contributor name/location fields, separate from the owning Bluesky identity, and backfills `Nat` / `Missouri` on the 40 migrated catalog strategies. Do **not** apply it again.

- pre-migration Time Travel bookmark: `000000e2-00000000-000050d3-70dfc94356a041f7b33fa69e34f9c9a5`
- post-migration Time Travel bookmark: `000000e2-00000006-000050d3-05d74d277993ad44e0c3d420303ac6ee`
- local, gitignored full export: `backend/.wrangler/backups/allneeds-db-before-strategy-contributors-2026-08-25.sql`
- final verification: both `TEXT` columns present, all 40 migrated rows attributed to `Nat` / `Missouri`, empty foreign-key check, and `PRAGMA quick_check = ok`

The Worker supports these Cloudflare environment variables:

- `ADMIN_DIDS`: comma-separated allowlist of **verified** Bluesky DIDs that may hide/restore community strategies. Do not populate it with a handle or a guessed DID. Add an admin DID only after the backend OAuth flow has authenticated that profile and `/api/me` reports `verified: true`.
- `ALLOW_LEGACY_AUTH`: temporary cutover switch. Set exactly `1` only while the old browser-OAuth frontend still needs `/auth/session`. Remove it (or set anything other than `1`) as part of the React auth cutover. With the switch off, `/auth/session` is disabled and private `/api/*` operations reject old unverified sessions.

`ALLOW_LEGACY_AUTH=1` deliberately preserves the previous security boundary for a short staging window; it is not the intended steady state.

Production now explicitly sets `ALLOW_LEGACY_AUTH=0` in `wrangler.jsonc`. This is intentionally explicit rather than omitted because `keep_vars: true` would otherwise preserve the former dashboard value. The verified `ADMIN_DIDS` value is explicit as well, so future repository deployments preserve the production moderation allowlist.

## Deployment order

The backend and frontend auth cutover must not be deployed in the wrong order.

Steps 1-12 were completed on 2026-08-25. PR #64 remains draft while the feature-branch deployment is tested on the live site.

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
11. Deploy the React changes that use verified backend login and stable strategy sync.
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

The Worker is only the dynamic API layer. Static application assets, bundled system strategies, icons, CSS, and JavaScript remain on GitHub Pages. The frontend resolves one public community-strategy snapshot during its existing boot overlay and reuses it in browser persistence and memory; it must still open normally if the Worker is slow or unavailable.

The browser persists a successfully checked Public/Most recent snapshot for one hour, while an explicit Shared Strategies refresh bypasses that freshness window. Public feed requests do not resolve the signed-in session because their result is identical for every viewer, avoiding an unnecessary D1 session-row read on cache misses. The public response also carries a one-hour browser-private cache header as a fallback when application storage is unavailable.

`POST /api/profile/save` combines the profile snapshot and owned-strategy reconciliation into one streamed Worker request. The complete browser strategy set remains authoritative, but the Worker reads the owner's server set once and writes only changed/new rows, changed Need relationships, and removed sharing. An unchanged 40-strategy profile performs no strategy or relationship writes. The first stream event confirms the durable snapshot time; the final event reports changed, unchanged, and unpublished counts.


