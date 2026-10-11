import { describe, expect, it } from 'vitest';

import app, { homeScreenHandoffPage } from './index.js';
import {
  claimHomeScreenHandoff,
  completeHomeScreenHandoff,
  homeScreenHandoffProof,
  registerHomeScreenHandoff,
} from './homeScreenHandoff.js';

const handoff = 'A'.repeat(43);
const secret = 'B'.repeat(43);

function createDatabase() {
  const rows = new Map();
  return {
    rows,
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                if (sql.includes('INSERT OR IGNORE INTO oauth_states')) {
                  const [key, value] = values;
                  if (rows.has(key)) return { meta: { changes: 0 } };
                  rows.set(key, { value, expires_at: '2099-01-01 00:00:00' });
                  return { meta: { changes: 1 } };
                }
                if (sql.includes('UPDATE oauth_states')) {
                  const [value, key, expected] = values;
                  const row = rows.get(key);
                  if (!row || (expected !== undefined && row.value !== expected)) return { meta: { changes: 0 } };
                  rows.set(key, { ...row, value });
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } };
              },
              async first() {
                return rows.get(values[0]) ?? null;
              },
            };
          },
        };
      },
    },
  };
}

describe('installed-app sign-in handoff', () => {
  it('reveals no session while pending and releases it only for the originating secret', async () => {
    const database = createDatabase();
    const proof = await homeScreenHandoffProof(secret);

    await expect(registerHomeScreenHandoff(database, handoff, proof)).resolves.toBe(true);
    await expect(claimHomeScreenHandoff(database, handoff, secret)).resolves.toEqual({ status: 'pending' });
    await expect(claimHomeScreenHandoff(database, handoff, 'C'.repeat(43))).resolves.toEqual({ status: 'invalid' });

    const completed = await completeHomeScreenHandoff(database, handoff, {
      sessionId: 'verified-session',
      did: 'did:plc:home-screen',
      handle: 'person.example',
    });
    expect(completed).toMatchObject({ completed: true });
    await expect(claimHomeScreenHandoff(database, handoff, secret, completed.confirmationCode)).resolves.toEqual({
      status: 'complete',
      sessionId: 'verified-session',
      did: 'did:plc:home-screen',
      handle: 'person.example',
    });
  });

  it('does not let a repeated login replace an existing handoff', async () => {
    const database = createDatabase();
    const proof = await homeScreenHandoffProof(secret);
    await expect(registerHomeScreenHandoff(database, handoff, proof)).resolves.toBe(true);
    await expect(registerHomeScreenHandoff(database, handoff, await homeScreenHandoffProof('C'.repeat(43)))).resolves.toBe(false);
    await expect(claimHomeScreenHandoff(database, handoff, secret)).resolves.toEqual({ status: 'pending' });
  });

  it('locks a handoff after five incorrect confirmation codes', async () => {
    const database = createDatabase();
    await registerHomeScreenHandoff(database, handoff, await homeScreenHandoffProof(secret));
    const completed = await completeHomeScreenHandoff(database, handoff, {
      sessionId: 'verified-session',
      did: 'did:plc:home-screen',
      handle: 'person.example',
    });
    const wrongCode = completed.confirmationCode === '000000' ? '999999' : '000000';
    for (let attempt = 1; attempt < 5; attempt += 1) {
      await expect(claimHomeScreenHandoff(database, handoff, secret, wrongCode)).resolves.toMatchObject({
        status: 'code-mismatch',
        attemptsRemaining: 5 - attempt,
      });
    }
    await expect(claimHomeScreenHandoff(database, handoff, secret, wrongCode)).resolves.toEqual({
      status: 'locked',
      attemptsRemaining: 0,
    });
    await expect(claimHomeScreenHandoff(database, handoff, secret, completed.confirmationCode)).resolves.toEqual({ status: 'locked' });
  });

  it('sets the verified session cookie in the browser context that claims the handoff', async () => {
    const database = createDatabase();
    await registerHomeScreenHandoff(database, handoff, await homeScreenHandoffProof(secret));
    const completed = await completeHomeScreenHandoff(database, handoff, {
      sessionId: 'verified-session',
      did: 'did:plc:home-screen',
      handle: 'person.example',
    });

    const response = await app.fetch(new Request('https://backend.allneeds.app/auth/handoff/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://allneeds.app' },
      body: JSON.stringify({ handoff, secret, code: completed.confirmationCode }),
    }), { DB: database.DB, ADMIN_DIDS: 'did:plc:home-screen' }, {});

    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('allneeds_session=verified-session');
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      signedIn: true,
      did: 'did:plc:home-screen',
      verified: true,
      admin: true,
    });
  });

  it('shows the confirmation code only in the completed Safari callback page', async () => {
    const response = homeScreenHandoffPage({
      sessionId: 'safari-session',
      homeScreenHandoff: { status: 'complete', confirmationCode: '123456' },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(response.headers.get('Set-Cookie')).toBeNull();
    expect(html).toContain('123 456');
    expect(html).toContain('Return to the <strong>allneeds home-screen app</strong>');
    expect(html).not.toContain('safari-session');
  });
});
