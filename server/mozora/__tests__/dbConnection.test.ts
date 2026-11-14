import { describe, expect, it } from 'vitest';
import { connectionConfig, errorCode } from '../dbConnection.js';

const CA = '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n';

describe('connectionConfig', () => {
  it('removes every SSL setting from the URL so it cannot override verification', () => {
    const cfg = connectionConfig(
      'postgresql://u:p@host.example:5432/postgres?sslmode=require&uselibpqcompat=true&sslrootcert=x&application_name=mozora',
      CA,
    );
    const url = new URL(String(cfg.connectionString));
    for (const p of ['sslmode', 'uselibpqcompat', 'sslrootcert']) expect(url.searchParams.has(p), p).toBe(false);
    expect(url.searchParams.get('application_name')).toBe('mozora');
  });

  it('always verifies the server against the given authority', () => {
    const cfg = connectionConfig('postgresql://u:p@host.example:5432/postgres?sslmode=disable', CA);
    expect(cfg.ssl).toEqual({ ca: CA, rejectUnauthorized: true });
  });

  it('keeps a small pool', () => {
    expect(connectionConfig('postgresql://u:p@h:5432/d', CA).max).toBe(3);
  });
});

describe('errorCode', () => {
  it('returns a code or class name, never a message', () => {
    expect(errorCode(Object.assign(new Error('postgresql://user:secret@host failed'), { code: 'SELF_SIGNED_CERT_IN_CHAIN' }))).toBe('SELF_SIGNED_CERT_IN_CHAIN');
    expect(errorCode(Object.assign(new Error('x'), { code: '28P01' }))).toBe('28P01');
    expect(errorCode(new TypeError('postgresql://user:secret@host'))).toBe('TypeError');
    expect(errorCode({ code: 'has spaces and secret' })).toBe('unknown');
    expect(errorCode('postgresql://user:secret@host')).toBe('unknown');
  });
});
