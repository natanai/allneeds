# Community strategy ownership

This document records the ownership boundary for strategies that come from people rather than the allneeds editorial/system catalog.

## Product rule

Bluesky authentication is optional. It is an ownership capability, not an admission requirement.

A person must be able to browse public strategies, use need pages, save strategies locally, and contribute through the export/email workflow without signing in. When a person does choose to authenticate with Bluesky, allneeds can use their DID as the stable owner identity for strategies they publish through their profile.

Bluesky provides authentication/identity. The strategy records themselves are allneeds data.

## Three strategy cases

### System/editorial strategies

- Maintained in the repository.
- `provenance: "system"`.
- Not owned by an end-user account.
- May include editorial evidence/source metadata.

### Imported community strategies without an account owner

- Submitted through the personal-strategy export/email workflow.
- Reviewed and imported with **Upload user submitted strategies**.
- Stored in `src/data/userStrategies.json`.
- `provenance: "user"` in the runtime catalog.
- May carry contributor name/location attribution.
- Do not invent an owner DID or Bluesky account for these entries.

This is the correct model for contributions such as the existing Autumn strategy: the contribution has a human author attribution without pretending that allneeds controls an account for that person.

### Account-owned community strategies

- Created from a `personal: true` inventory entry by a person who chooses to authenticate.
- The backend associates the shared record with the authenticated Bluesky DID.
- Public records are eligible for the shared feed and the relevant need pages.
- The author's editable inventory copy remains the local/profile source of truth for the current frontend sync model.

## Need-page deck composition

During the branded startup preload, allneeds starts one best-effort request for the recent public shared-strategy snapshot so community strategies can already be available when a Need page opens. The request shares the same in-memory cache and in-flight promise used by the Need pages; a successful boot request therefore does not create another network request for every Need the person visits.

The public snapshot is an enhancement, not a startup dependency. The existing maximum boot deadline still releases the interface even if Cloudflare is slow or unavailable. A failed shared-feed request is not stored as the feed cache, so a later Need-page open or explicit refresh can retry. If the boot request is merely still in flight when the interface opens, the Need page joins that same promise instead of starting a duplicate request.

The need page combines:

1. public account-owned community strategies that support the need;
2. repository-imported community strategies that support the need;
3. system/editorial strategies that support the need.

Before a user presses **Shuffle**, the deck priority is:

1. user-made strategies with a named contributor;
2. other user-made strategies;
3. system strategies.

Source order remains stable inside a priority tier. Live records that duplicate an already-published repository community strategy by title/body/needs are deduplicated so migrations do not produce two visible cards.

After **Shuffle**, provenance no longer controls ordering. If live data arrives after the user has shuffled, reconcile new cards without rebuilding the already-shuffled deck.

## Inventory and publishing boundary

Saving a strategy to the inventory is not the same thing as authoring it.

- `personal: true` means the inventory entry was authored as the current person's personal strategy.
- A community or catalog card saved from elsewhere has `personal: false` even if its original visibility was public.
- Profile strategy publishing/sync must include only the signed-in user's `personal: true` entries whose visibility is `public` or `followers`.
- A saved copy of another person's public strategy may be included in the user's profile/browser backup, but must never be republished under that user's DID.

This boundary is security- and attribution-sensitive. Keep regression coverage around it.

## Editing in the current frontend/backend contract

The current backend exposes strategy create/list/feed/sync behavior but does not expose a stable-ID PATCH/DELETE API. For now, editing a signed-in user's personal inventory strategy updates the local copy and then runs profile sync. The backend reconciles the changed published set.

This gives account owners an editable workflow without treating downloaded community strategies as their authored work. A future backend contract should preserve stable remote IDs across edits.

## Identity verification prerequisite

Production now establishes ownership through the backend AT Protocol OAuth flow. The Worker obtains the DID from the verified OAuth result, creates its own verified HttpOnly session, and removes the temporary Bluesky credential. The former `/auth/session` compatibility path is disabled with `ALLOW_LEGACY_AUTH=0`. A React-only DID check, handle check, hidden menu, or hard-coded client value remains insufficient as an authorization boundary.

## Legacy Nat migration

The legacy production strategy source contained 40 strategies attributed to `Nat, Missouri`. On 2026-08-25, those strategies moved to the verified account-owned profile for `did:plc:w23qsgdsux3neuguxfy7kvt5`.

The completed safe migration sequence was:

1. add verified backend identity and stable strategy ownership;
2. identify Nat's profile through that verified server-side identity;
3. create account-owned records for the 40 legacy strategies while preserving title/body/need associations;
4. verify those records appear on the correct Need pages and can be edited by the owner;
5. only then remove the corresponding static legacy copies so there is one source of truth;
6. retain a migration mapping/stable remote ID so later title/body edits cannot resurrect the old static card as a duplicate.

The stable slug/client-key mapping is retained in `src/data/natProfileStrategyMigration.json`, and the guarded preparation/rehearsal script is `scripts/prepare-nat-profile-migration.mjs`. The repository catalog now excludes those 40 static copies, so profile edits cannot reveal an older variant. The account-free `userStrategies.json` lane remains separate; Autumn's contribution, for example, stays unclaimed unless a verified claim process is deliberately introduced later.

## Moderation boundary

Global community moderation must be authorized by the backend. A React-only admin check is not sufficient.

The desired backend model is approximately:

```text
id
ownerDid
createdAt
updatedAt
title
body
needIds
visibility
moderationStatus
```

Recommended moderation semantics:

- `moderationStatus = visible | hidden`
- **Hide from community** removes the strategy from public/follower discovery.
- Hiding does not delete the author's record and does not rewrite the author's chosen visibility.
- **Restore to community** reverses the moderation state.
- Admin authorization is based on the verified authenticated DID on the server, not a client-visible flag alone.

Once the backend exposes an authenticated moderation capability, public community cards can add the ellipsis moderation actions without changing the ownership model above.

## Current backend scaling limitation

The production feed API currently supports scope/sort/limit but no need-specific server filter. At the site's current scale, startup therefore requests one recent public snapshot at the backend maximum (`limit=100`) and Need pages filter that cached snapshot client-side. This minimizes Worker requests and makes community cards immediately available after boot.

As the public catalog grows, the backend should support a need filter and/or pagination so older relevant strategies cannot fall outside the first snapshot. That scaling change should preserve the startup rule that Cloudflare is optional: local/system strategies must remain usable even when the shared service is unavailable.

## Import workflow compatibility

The repository importer is intentionally preserved. Architecture changes must not break:

- `data/user-strategy-uploads/`
- `scripts/import-user-submitted-strategies.mjs`
- `.github/workflows/upload-user-submitted-strategies.yml`
- publication into `src/data/userStrategies.json`

Account ownership and the repository import lane are complementary. Neither replaces the other.
