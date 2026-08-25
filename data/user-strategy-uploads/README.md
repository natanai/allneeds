# User strategy upload inbox

This folder is the maintainer inbox for **account-free community strategy submissions**. A contributor does not need a Bluesky account for their strategy to be published or attributed on allneeds.app.

## From the site to this folder

1. A contributor uses **Share this strategy with Nat…** on allneeds.app.
2. The site downloads a `.json` personal-strategy export and prepares an email to Nat.
3. After reviewing the submission, place the attached `.json` file in this folder.
4. Commit the upload to `main`.
5. Run the **Upload user submitted strategies** workflow from GitHub Actions.

## What the workflow does

The workflow runs `scripts/import-user-submitted-strategies.mjs` and validates the whole batch before publishing anything.

- Valid strategies are added to `src/data/userStrategies.json` as user-made/community strategies.
- Contributor attribution in the export is preserved; do not invent an account, DID, or Bluesky identity for an unauthenticated contributor.
- Exact duplicates are skipped.
- Successfully processed `.json` upload files are deleted from this inbox after publication.
- If any file is invalid, the workflow fails before publishing or deleting the batch so the file can be inspected and corrected.

Keep this README in the folder. The workflow processes only `.json` files.

This import path is intentionally supported alongside optional Bluesky-authenticated profile strategies. Do not remove or bypass it when changing the shared-strategy architecture.
