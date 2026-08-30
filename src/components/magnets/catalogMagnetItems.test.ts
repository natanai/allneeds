import { describe, expect, it } from 'vitest';

import { feelingMagnetItem, needMagnetItem } from './catalogMagnetItems';

describe('catalog magnet items', () => {
  it('gives Needs one stable shared magnet identity', () => {
    expect(needMagnetItem({ slug: 'connection', title: 'Connection' })).toMatchObject({
      id: 'needs-connection',
      label: 'Connection',
      to: '/needs/connection',
      kind: 'need',
      tone: 'selection',
    });
    expect(needMagnetItem({ slug: 'connection', title: 'Connection' }).iconUrl).toContain('icons/needs/connection.svg');
  });

  it('gives Feelings one stable shared magnet identity', () => {
    expect(feelingMagnetItem({ slug: 'anxious', title: 'Anxious' })).toMatchObject({
      id: 'feelings-anxious',
      label: 'Anxious',
      to: '/feelings/anxious',
      kind: 'feeling',
      tone: 'selection',
    });
    expect(feelingMagnetItem({ slug: 'anxious', title: 'Anxious' }).iconUrl).toContain('icons/feelings/anxious.svg');
  });
});
