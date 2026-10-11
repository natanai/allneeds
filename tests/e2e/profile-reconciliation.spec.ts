import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

function entry(id: string, notes: string) {
  return { id, notes, dateISO: '2026-10-10T23:00:00.000Z', emotion: '', feelings: [], intensity: 5, needs: [], tags: [], sensations: [], strategies: [], source: 'journal' };
}

function snapshot(entries: ReturnType<typeof entry>[], theme = 'device') {
  return {
    'allneeds.v2.journal': JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-10T23:00:00Z', data: { entries } }),
    'nvcApp.theme': JSON.stringify({ preset: theme, updatedAt: 1 }),
  };
}

async function signInReturn(
  page: Page,
  device: Record<string, string>,
  profile: Record<string, string>,
  path = '/inventory/journal',
  saves: Record<string, unknown>[] = [],
) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('profile-test-seeded')) return;
    Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
    sessionStorage.setItem('profile-test-seeded', '1');
  }, device);
  await page.route('https://backend.allneeds.app/api/me', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', signedIn: true, did: 'did:plc:phone-test', handle: 'phone.example', verified: true }) }));
  await page.route('https://backend.allneeds.app/api/user-settings', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', settings: [{ key: 'allneeds_export_v1', value: JSON.stringify({ version: 1, localStorage: profile }) }] }) }));
  await page.route('https://backend.allneeds.app/api/profile/save', async (route) => {
    saves.push(JSON.parse(route.request().postData()!));
    await route.fulfill({ contentType: 'application/x-ndjson', body: `${JSON.stringify({ stage: 'profile-saved', status: 'ok', savedAt: '2026-10-10T23:10:00Z', strategyCount: 0 })}\n${JSON.stringify({ stage: 'complete', status: 'ok', savedAt: '2026-10-10T23:10:00Z', syncedAt: '2026-10-10T23:10:01Z', syncedCount: 0 })}\n` });
  });
  await page.goto(`${path}${path.includes('?') ? '&' : '?'}auth=verified`);
  await expect(page.getByRole('alertdialog')).toBeVisible();
}

test('local journal warning merges into the profile without a comparison screen or second save step', async ({ page }) => {
  const device = snapshot([entry('phone', 'Written while signed out')]);
  const profile = snapshot([entry('account', 'Already in my account')], 'profile');
  const saves: Record<string, unknown>[] = [];
  await signInReturn(page, device, profile, '/inventory/journal', saves);

  const warning = page.getByRole('alertdialog', { name: 'Local entries found' });
  await expect(warning).toContainText('1 local journal entry not saved in your profile');
  await expect(warning.getByRole('button', { name: 'Merge into profile' })).toBeVisible();
  await expect(warning.getByRole('button', { name: 'Discard local entries' })).toBeVisible();
  await expect(warning.getByText('Review journal differences')).toHaveCount(0);

  await warning.getByRole('button', { name: 'Merge into profile' }).click();
  const result = page.getByRole('alertdialog', { name: 'Finished' });
  await expect(result).toContainText('merged into your saved profile');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.map((item: { notes: string }) => item.notes).sort())).toEqual(['Already in my account', 'Written while signed out']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nvcApp.theme')!).preset)).toBe('profile');
  expect(saves).toHaveLength(1);
  const backup = JSON.parse(String(saves[0]?.value));
  expect(backup.journalEntries).toHaveLength(2);
  expect(backup.localStorage['allneeds:profile-recovery-v1']).toBeUndefined();

  await result.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText('Written while signed out', { exact: true })).toBeVisible();
  await expect(page.getByText('Already in my account', { exact: true })).toBeVisible();
});

test('discarding local entries loads the account copy and keeps a recovery copy', async ({ page }) => {
  const device = snapshot([entry('phone', 'Discard this local entry')]);
  await signInReturn(page, device, snapshot([entry('account', 'Keep this account entry')], 'profile'));
  const warning = page.getByRole('alertdialog', { name: 'Local entries found' });
  await warning.getByRole('button', { name: 'Discard local entries' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Finished' })).toContainText('saved profile was loaded');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.map((item: { notes: string }) => item.notes))).toEqual(['Keep this account entry']);
  expect(await page.evaluate(() => localStorage.getItem('allneeds:profile-recovery-v1'))).not.toBeNull();
});

test('routine profile differences use a lightweight load warning', async ({ page }) => {
  await signInReturn(page, snapshot([]), snapshot([entry('account', 'Account entry')], 'profile'));
  const warning = page.getByRole('alertdialog', { name: 'Load saved profile?' });
  await expect(warning).toContainText('saved profile will replace data stored in this browser');
  await warning.getByRole('button', { name: 'Load profile' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Finished' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries[0].notes)).toBe('Account entry');
});

test('canceling the warning leaves local data unchanged', async ({ page }) => {
  const device = snapshot([entry('phone', 'Keep my phone entry')]);
  await signInReturn(page, device, snapshot([entry('account', 'Account-only entry')]));
  await page.getByRole('alertdialog', { name: 'Local entries found' }).getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('allneeds.v2.journal'))).toBe(device['allneeds.v2.journal']);
});

test('different edits to one entry are treated as local content at risk and preserve both when merged', async ({ page }) => {
  await signInReturn(page, snapshot([entry('same-id', 'Phone edit')]), snapshot([entry('same-id', 'Account edit')]));
  const warning = page.getByRole('alertdialog', { name: 'Local entries found' });
  await expect(warning).toContainText('1 local journal entry');
  await warning.getByRole('button', { name: 'Merge into profile' }).click();
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.map((item: { id: string }) => item.id));
  expect(new Set(ids).size).toBe(2);
});

test('failed profile fetch leaves the phone entry available and offers a retry', async ({ page }) => {
  await signInReturn(page, snapshot([entry('phone', 'My protected entry')]), snapshot([]));
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await page.route('https://backend.allneeds.app/api/user-settings', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
  await menu.getByRole('button', { name: /Account & data/ }).click();
  await menu.getByRole('button', { name: 'Load saved profile', exact: true }).click();
  const warning = page.getByRole('alertdialog', { name: 'Sign-in problem' });
  await expect(warning.getByRole('alert')).toContainText('device data has been left in place');
  await expect(warning.getByRole('button', { name: 'Try again' })).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries[0].notes)).toBe('My protected entry');
});

test('the warning owns keyboard focus even when the journal composer is open', async ({ page }) => {
  await signInReturn(page, snapshot([entry('phone', 'Phone entry')]), snapshot([entry('account', 'Account entry')]), '/inventory/journal?compose=new');
  const warning = page.getByRole('alertdialog', { name: 'Local entries found' });
  await warning.getByRole('button', { name: 'Discard local entries' }).focus();
  await page.keyboard.press('Tab');
  await expect(warning.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(warning).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Journal', exact: true })).toBeVisible();
});

test('installed app claims Safari verification before warning about its own local journal', async ({ page }) => {
  const handoff = 'A'.repeat(43);
  const secret = 'B'.repeat(43);
  const device = snapshot([entry('home-screen', 'Written in the home-screen app')]);
  const profile = snapshot([entry('profile', 'Already in the saved profile')]);
  await page.addInitScript(({ handoffId, handoffSecret, stored }) => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    Object.entries(stored).forEach(([key, value]) => localStorage.setItem(key, value));
    localStorage.setItem('allneeds:home-screen-sign-in-v1', JSON.stringify({ version: 1, handoff: handoffId, secret: handoffSecret, createdAt: Date.now() }));
  }, { handoffId: handoff, handoffSecret: secret, stored: device });
  const session = { status: 'ok', signedIn: true, did: 'did:plc:installed-app', handle: 'phone.example', verified: true, admin: false };
  let claimBody: unknown = null;
  await page.route('https://backend.allneeds.app/auth/handoff/claim', async (route) => {
    claimBody = JSON.parse(route.request().postData() ?? '{}');
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(session) });
  });
  await page.route('https://backend.allneeds.app/api/me', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(session) }));
  await page.route('https://backend.allneeds.app/api/user-settings', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', settings: [{ key: 'allneeds_export_v1', value: JSON.stringify({ version: 1, localStorage: profile }) }] }) }));

  await page.goto('/inventory/journal');
  const finishSignIn = page.getByRole('alertdialog', { name: 'Finish sign-in' });
  await finishSignIn.getByLabel('Safari confirmation code').fill('123 456');
  await finishSignIn.getByRole('button', { name: 'Finish sign-in' }).click();

  const warning = page.getByRole('alertdialog', { name: 'Local entries found' });
  await expect(warning).toContainText('1 local journal entry');
  expect(claimBody).toEqual({ handoff, secret, code: '123456' });
  expect(await page.evaluate(() => localStorage.getItem('allneeds:home-screen-sign-in-v1'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries)).toHaveLength(1);
});

test('Safari callback sends an installed-app sign-in back to the Home Screen without changing Safari data', async ({ page }) => {
  const handoff = 'A'.repeat(43);
  const backendRequests: string[] = [];
  await page.route('https://backend.allneeds.app/**', async (route) => {
    backendRequests.push(route.request().url());
    await route.fulfill({ status: 500, body: '{}' });
  });
  await page.goto(`/inventory/journal?auth=verified&authHandoff=${handoff}`);
  const notice = page.getByRole('alertdialog', { name: 'Return to the home-screen app' });
  await expect(notice).toContainText('Bluesky sign-in finished in Safari');
  expect(backendRequests.some((url) => /\/api\/(?:me|user-settings)|\/auth\/handoff\/claim/u.test(url))).toBe(false);
});
