# User strategy upload inbox

Drop the `.json` files emailed from the allneeds.app personal-strategy export into this folder, commit them to `main`, then run the **Upload user submitted strategies** workflow from GitHub Actions.

The workflow validates every file before publishing anything. Valid strategies are added to `src/data/userStrategies.json`; exact duplicates are skipped; successfully processed upload files are deleted. If a file is invalid, the workflow fails before publishing or deleting the batch so the file can be inspected and corrected.

Keep this README in the folder. The workflow processes only `.json` files.
