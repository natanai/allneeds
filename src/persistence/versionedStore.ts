import type { StorageDriver } from './storage';

export interface VersionedEnvelope<T> {
  schemaVersion: number;
  savedAt: string;
  data: T;
}

export type StoreReadResult<T> =
  | { status: 'empty' }
  | { status: 'ready'; value: T; savedAt: string }
  | { status: 'invalid'; error: Error }
  | { status: 'unsupported'; foundVersion: number; supportedVersion: number };

interface VersionedStoreOptions<T> {
  key: string;
  schemaVersion: number;
  storage: StorageDriver | null;
  validate: (value: unknown) => value is T;
  now?: () => Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class VersionedStore<T> {
  private readonly key: string;
  private readonly schemaVersion: number;
  private readonly storage: StorageDriver | null;
  private readonly validate: (value: unknown) => value is T;
  private readonly now: () => Date;

  constructor({ key, schemaVersion, storage, validate, now = () => new Date() }: VersionedStoreOptions<T>) {
    this.key = key;
    this.schemaVersion = schemaVersion;
    this.storage = storage;
    this.validate = validate;
    this.now = now;
  }

  read(): StoreReadResult<T> {
    if (!this.storage) {
      return { status: 'empty' };
    }

    const raw = this.storage.getItem(this.key);
    if (!raw) {
      return { status: 'empty' };
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) {
        return { status: 'invalid', error: new Error('Stored value is not an object.') };
      }

      const foundVersion = Number(parsed.schemaVersion);
      if (!Number.isInteger(foundVersion) || foundVersion < 1) {
        return { status: 'invalid', error: new Error('Stored value has no valid schema version.') };
      }

      if (foundVersion !== this.schemaVersion) {
        return {
          status: 'unsupported',
          foundVersion,
          supportedVersion: this.schemaVersion,
        };
      }

      if (!this.validate(parsed.data)) {
        return { status: 'invalid', error: new Error('Stored data failed validation.') };
      }

      return {
        status: 'ready',
        value: parsed.data,
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
      };
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error('Unable to parse stored data.');
      return { status: 'invalid', error };
    }
  }

  write(value: T): VersionedEnvelope<T> {
    if (!this.validate(value)) {
      throw new Error('Refusing to persist data that failed validation.');
    }

    const envelope: VersionedEnvelope<T> = {
      schemaVersion: this.schemaVersion,
      savedAt: this.now().toISOString(),
      data: value,
    };

    this.storage?.setItem(this.key, JSON.stringify(envelope));
    return envelope;
  }

  clear(): void {
    this.storage?.removeItem(this.key);
  }
}
