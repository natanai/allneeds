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

async function signInReturn(page: Page, device: Record<string, string>, profile: Record<string, string>, path = '/inventory/journal') {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((data) => {
    if (localStorage.getItem('profile-test-seeded')) return;
    Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
    localStorage.setItem('profile-test-seeded', '1');
  }, device);
  await page.route('https://backend.allneeds.app/api/me', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', signedIn: true, did: 'did:plc:phone-test', handle: 'phone.example', verified: true }) }));
  await page.route('https://backend.allneeds.app/api/user-settings', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', settings: [{ key: 'allneeds_export_v1', value: JSON.stringify({ version: 1, localStorage: profile }) }] }) }));
  await page.goto(`${path}${path.includes('?') ? '&' : '?'}auth=verified`);
  await expect(page.getByRole('dialog', { name: 'Review saved data' })).toBeVisible();
}

test('phone sign-in keeps the signed-out journal and account entries, with explicit profile backup', async ({ page }) => {
  const device = snapshot([entry('phone', 'Written while signed out')]);
  const profile = snapshot([entry('account', 'Already in my account')], 'profile');
  const saves: Record<string, unknown>[] = [];
  await page.route('https://backend.allneeds.app/api/profile/save', async (route) => {
    saves.push(JSON.parse(route.request().postData()!));
    await route.fulfill({ contentType: 'application/x-ndjson', body: `${JSON.stringify({ stage: 'profile-saved', savedAt: '2026-10-10T23:10:00Z' })}\n${JSON.stringify({ stage: 'complete', status: 'ok', syncedCount: 0 })}\n` });
  });
  await signInReturn(page, device, profile);
  const review = page.getByRole('dialog', { name: 'Review saved data' });
  const combineButton = review.getByRole('button', { name: 'Keep entries from both', exact: true });
  await expect(combineButton).toBeVisible();
  const combineBox = await combineButton.boundingBox();
  expect(combineBox).not.toBeNull();
  expect(combineBox!.y + combineBox!.height).toBeLessThanOrEqual(844);
  await review.getByText('Review journal differences').click();
  await expect(review.getByText('Written while signed out', { exact: true })).toBeVisible();
  await expect(review.getByText('Already in my account', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.length)).toBe(1);
  expect(saves).toHaveLength(0);
  await review.getByLabel('Use saved profile settings').check();
  await review.getByRole('button', { name: 'Keep entries from both', exact: true }).click();
  const result = page.getByRole('dialog', { name: 'Your data' });
  await expect(result).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.map((item: { notes: string }) => item.notes).sort())).toEqual(['Already in my account', 'Written while signed out']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nvcApp.theme')!).preset)).toBe('profile');
  expect(saves).toHaveLength(0);
  await result.getByRole('button', { name: 'Save this device to profile', exact: true }).click();
  await expect(result.getByRole('button', { name: 'Saved to profile', exact: true })).toBeDisabled();
  const backup = JSON.parse(String(saves[0]?.value));
  expect(backup.journalEntries).toHaveLength(2);
  expect(backup.localStorage['allneeds:profile-recovery-v1']).toBeUndefined();
  await result.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Written while signed out', { exact: true })).toBeVisible();
  await expect(page.getByText('Already in my account', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('keeping this device dismisses the sign-in review without changing or uploading its data', async ({ page }) => {
  const device = snapshot([entry('phone', 'Keep my phone entry')]);
  await signInReturn(page, device, snapshot([entry('account', 'Account-only entry')]));
  await page.getByRole('button', { name: 'Keep this device', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('allneeds.v2.journal'))).toBe(device['allneeds.v2.journal']);
  await expect(page.getByText('Keep my phone entry', { exact: true })).toBeVisible();
});

test('different edits to one entry preserve both versions after combining', async ({ page }) => {
  await signInReturn(page, snapshot([entry('same-id', 'Phone edit')]), snapshot([entry('same-id', 'Account edit')]));
  const review = page.getByRole('dialog', { name: 'Review saved data' });
  await review.getByText('Review journal differences').click();
  await expect(review.getByText('Changed entry · both versions will be kept')).toBeVisible();
  await review.getByRole('button', { name: 'Keep entries from both' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Phone edit', { exact: true })).toBeVisible();
  await expect(page.getByText('Account edit', { exact: true })).toBeVisible();
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.map((item: { id: string }) => item.id));
  expect(new Set(ids).size).toBe(2);
});

test('failed profile fetch leaves the phone entry available and offers a retry', async ({ page }) => {
  await signInReturn(page, snapshot([entry('phone', 'My protected entry')]), snapshot([]));
  await page.getByRole('button', { name: 'Keep this device', exact: true }).click();
  await page.route('https://backend.allneeds.app/api/user-settings', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
  await menu.getByRole('button', { name: /Account & data/ }).click();
  await menu.getByRole('button', { name: 'Load saved profile', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Review saved data' });
  await expect(review.getByRole('alert')).toContainText('device data has been left in place');
  await expect(review.getByRole('button', { name: 'Try again' })).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries[0].notes)).toBe('My protected entry');
});

test('an account review owns keyboard focus even when the journal composer is open', async ({ page }) => {
  await signInReturn(page, snapshot([entry('phone', 'Phone entry')]), snapshot([entry('account', 'Account entry')]), '/inventory/journal?compose=new');
  const review = page.getByRole('dialog', { name: 'Review saved data' });
  await review.getByRole('button', { name: 'Download profile backup' }).focus();
  await page.keyboard.press('Tab');
  await expect(review.getByRole('button', { name: 'Keep this device and close review' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(review).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Journal', exact: true })).toBeVisible();
});
