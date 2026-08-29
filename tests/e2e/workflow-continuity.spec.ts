import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

function collectRuntimeProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  return problems;
}

test('an Observation draft survives routes and reload, then hands off exactly once', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  const observation = 'Tuesday at 3 p.m. in the kitchen, I heard “Please wait” twice.';
  await page.goto('/observations');
  const editor = page.getByLabel('What did you notice?');
  await editor.fill(observation);
  const loadMatches = page.getByRole('button', { name: 'Load possible feelings and needs' });
  await expect(loadMatches).toBeEnabled();
  await loadMatches.click();
  await page.getByRole('radio', { name: 'Met', exact: true }).click();

  const nav = page.getByLabel('Primary navigation magnets');
  await nav.getByRole('link', { name: 'Needs', exact: true }).click();
  await nav.getByRole('link', { name: 'Observations', exact: true }).click();
  await expect(editor).toHaveText(observation);
  await expect(page.getByRole('radio', { name: 'Met', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: 'Possible Feelings and Needs' })).toBeVisible();

  await page.reload();
  await expect(editor).toHaveText(observation);
  await expect(page.getByRole('radio', { name: 'Met', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Open in Journal', exact: true }).click();

  const journalDialog = page.getByRole('dialog', { name: 'Journal' });
  await expect(journalDialog).toBeVisible();
  await expect(journalDialog.getByLabel('Reflection')).toHaveValue(observation);
  await journalDialog.getByRole('button', { name: 'Clear', exact: true }).click();
  await journalDialog.getByRole('button', { name: 'Close full screen journal' }).click();
  await nav.getByRole('link', { name: 'Observations', exact: true }).click();
  await expect(editor).toHaveText('');
  expect(runtimeProblems).toEqual([]);
});

test('Journal drafts survive close/reload and successful save or clear removes them', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/inventory/journal?compose=new');
  let dialog = page.getByRole('dialog', { name: 'Journal' });
  await dialog.getByLabel('Reflection').fill('I noticed relief after asking for help.');
  await dialog.getByRole('button', { name: 'Feeling', exact: true }).click();
  let feelingPicker = dialog.getByRole('dialog', { name: 'Choose one or more feelings' });
  await feelingPicker.getByLabel('Relieved intensity; 0 means not selected').fill('8');
  await feelingPicker.getByRole('button', { name: 'Done', exact: true }).click();
  await dialog.getByRole('button', { name: 'Needs', exact: true }).click();
  const needsPicker = dialog.getByRole('dialog', { name: 'Choose one or more needs' });
  await needsPicker.getByRole('option', { name: 'Support', exact: true }).click();
  await needsPicker.getByRole('button', { name: 'Done', exact: true }).click();
  await dialog.getByLabel('Tags', { exact: true }).fill('work, support');
  await page.waitForTimeout(250);
  await dialog.getByRole('button', { name: 'Close full screen journal' }).click();

  await page.reload();
  dialog = page.getByRole('dialog', { name: 'Journal' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Reflection')).toHaveValue('I noticed relief after asking for help.');
  await expect(dialog.getByRole('button', { name: 'Feeling', exact: true })).toContainText('Relieved');
  await expect(dialog.getByRole('button', { name: 'Needs', exact: true })).toContainText('Support');
  await expect(dialog.getByLabel('Tags', { exact: true })).toHaveValue('work, support');
  await dialog.getByRole('button', { name: 'Feeling', exact: true }).click();
  feelingPicker = dialog.getByRole('dialog', { name: 'Choose one or more feelings' });
  await expect(feelingPicker.getByLabel('Relieved intensity; 0 means not selected')).toHaveValue('8');
  await feelingPicker.getByRole('button', { name: 'Done', exact: true }).click();

  await dialog.getByRole('button', { name: 'Clear', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close full screen journal' }).click();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Journal' })).toHaveCount(0);

  await page.getByRole('button', { name: 'New entry', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Journal' });
  await dialog.getByLabel('Reflection').fill('Saved journal continuity check.');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Saved journal continuity check.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Journal' })).toHaveCount(0);
  await expect(page.getByText('Saved journal continuity check.', { exact: true })).toBeVisible();
  expect(runtimeProblems).toEqual([]);
});

test('Body Cue values restore after reload and Reset remains permanent', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/feelings/body-cues');
  const cue = page.locator('#chest-tight');
  await cue.fill('65');
  await expect(cue).toHaveValue('65');
  await expect(page.getByText('1 cue selected', { exact: true })).toBeVisible();

  await page.reload();
  await expect(cue).toHaveValue('65');
  await expect(page.getByText('1 cue selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset all cues' }).click();
  await expect(cue).toHaveValue('0');
  await page.reload();
  await expect(cue).toHaveValue('0');
  await expect(page.getByText('0 cues selected', { exact: true })).toBeVisible();
  expect(runtimeProblems).toEqual([]);
});

test('Inventory and per-Need strategy drafts restore independently and clear after saving', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/inventory');
  await page.getByText('Add a personal strategy', { exact: true }).click();
  const inventoryForm = page.locator('#inventory-form');
  await inventoryForm.getByLabel('Strategy name').fill('Ask for a quiet hour');
  await inventoryForm.getByLabel('How do you put it into practice?').fill('Put one protected hour on the calendar.');
  await inventoryForm.getByRole('button', { name: 'Needs', exact: true }).click();
  let needPicker = inventoryForm.getByRole('dialog', { name: 'Choose one or more needs' });
  await needPicker.getByRole('option', { name: 'Peace', exact: true }).click();
  await needPicker.getByRole('button', { name: 'Done', exact: true }).click();
  await inventoryForm.getByLabel('First name (optional)').fill('Local tester');
  await page.getByRole('button', { name: 'Needs care', exact: true }).click();

  const nav = page.getByLabel('Primary navigation magnets');
  await nav.getByRole('link', { name: 'Needs', exact: true }).click();
  await nav.getByRole('link', { name: /Inventory/ }).click();
  await expect(inventoryForm.getByLabel('Strategy name')).toHaveValue('Ask for a quiet hour');
  await expect(inventoryForm.getByLabel('How do you put it into practice?')).toHaveValue('Put one protected hour on the calendar.');
  await page.locator('#inventory-form-shell > summary').click();
  await expect(inventoryForm.getByRole('button', { name: 'Needs', exact: true })).toContainText('Peace');
  await expect(page.getByRole('button', { name: 'Needs care', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(inventoryForm.getByLabel('Strategy name')).toHaveValue('Ask for a quiet hour');
  await page.locator('#inventory-form-shell > summary').click();
  await inventoryForm.getByRole('button', { name: 'Device', exact: true }).click();
  await page.reload();
  await expect(inventoryForm.getByLabel('Strategy name')).toHaveValue('');
  await expect(inventoryForm.getByLabel('How do you put it into practice?')).toHaveValue('');
  await page.locator('#inventory-form-shell > summary').click();
  await expect(inventoryForm.getByRole('button', { name: 'Needs', exact: true })).toContainText('Choose needs');

  await page.goto('/needs/love-caring');
  let needForm = page.locator('#suggestion-form');
  await needForm.getByLabel('Strategy name').fill('Send a caring message');
  await needForm.getByLabel('How do you put it into practice?').fill('Choose one person and send a specific appreciation.');
  await page.goto('/needs/support');
  needForm = page.locator('#suggestion-form');
  await expect(needForm.getByLabel('Strategy name')).toHaveValue('');
  await page.goBack();
  needForm = page.locator('#suggestion-form');
  await expect(needForm.getByLabel('Strategy name')).toHaveValue('Send a caring message');
  await expect(needForm.getByLabel('How do you put it into practice?')).toHaveValue('Choose one person and send a specific appreciation.');
  await needForm.getByRole('button', { name: 'Device', exact: true }).click();
  await page.reload();
  await expect(needForm.getByLabel('Strategy name')).toHaveValue('');
  await expect(needForm.getByRole('button', { name: 'Needs', exact: true })).toContainText('Love/Caring');
  expect(runtimeProblems).toEqual([]);
});

test('a downloaded device backup restores removed Inventory data through the visible import flow', async ({ page }, testInfo) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/inventory');
  await page.getByText('Add a personal strategy', { exact: true }).click();
  const inventoryForm = page.locator('#inventory-form');
  await inventoryForm.getByLabel('Strategy name').fill('Backup restoration walk');
  await inventoryForm.getByLabel('How do you put it into practice?').fill('Take a quiet ten-minute walk after lunch.');
  await inventoryForm.getByRole('button', { name: 'Needs', exact: true }).click();
  const needPicker = inventoryForm.getByRole('dialog', { name: 'Choose one or more needs' });
  await needPicker.getByRole('option', { name: 'Peace', exact: true }).click();
  await needPicker.getByRole('button', { name: 'Done', exact: true }).click();
  await inventoryForm.getByRole('button', { name: 'Device', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Backup restoration walk' })).toBeVisible();

  await page.getByRole('button', { name: 'Open menu' }).click();
  let menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
  await menu.getByRole('button', { name: /Account & data/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await menu.getByRole('button', { name: 'Download backup', exact: true }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath('allneeds-local-backup.json');
  await download.saveAs(backupPath);
  await menu.getByRole('button', { name: 'Close menu' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('heading', { name: 'Backup restoration walk' })
    .locator('..')
    .getByRole('button', { name: 'Remove' })
    .click();
  await expect(page.getByRole('heading', { name: 'Backup restoration walk' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Open menu' }).click();
  menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
  await menu.getByRole('button', { name: /Account & data/ }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await menu.locator('input[type="file"][accept*="json"]').setInputFiles(backupPath);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('tab', { name: /Strategies/ }).click();
  await expect(page.getByRole('heading', { name: 'Backup restoration walk' })).toBeVisible();
  expect(runtimeProblems).toEqual([]);
});

test('Alexithymia stage, clues, decisions, and words restore until Start over', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await page.getByLabel('What happened?').fill('We stopped talking after dinner.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: /Body Choose sensations/ }).click();
  const bodySheet = page.getByRole('dialog', { name: 'Body clues' });
  await bodySheet.getByRole('button', { name: /Tight or constricted/ }).click();
  await bodySheet.getByLabel('Tight or constricted intensity').fill('70');
  await bodySheet.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Compare words' }).click();
  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  const candidateSheet = page.getByRole('dialog', { name: 'Anxiety' });
  await candidateSheet.getByRole('button', { name: 'Fits', exact: true }).click();
  await candidateSheet.getByRole('button', { name: 'Done', exact: true }).click();
  await page.waitForTimeout(250);

  await page.reload();
  await page.getByRole('button', { name: 'Continue check-in' }).click();
  await expect(page.getByRole('heading', { name: 'Possible words' })).toBeVisible();
  await expect(page.getByText('Anxiety').first()).toBeVisible();
  await page.getByRole('button', { name: 'Use these words' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start over' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start check-in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Possible words' })).toHaveCount(0);
  expect(runtimeProblems).toEqual([]);
});
