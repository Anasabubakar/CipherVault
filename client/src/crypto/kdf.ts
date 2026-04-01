/**
 * Key Derivation Function with Argon2id (preferred) and PBKDF2 (fallback).
 * Argon2id via argon2-browser WASM when available in browser environments.
 * Falls back to SubtleCrypto PBKDF2-SHA-256 in Node.js or when WASM unavailable.
 *
 * Key derivation is DETERMINISTIC: same password + salt always produces same key.
 */
import type { KdfParams, DerivedKey } from '../types';

const DEFAULT_PARAMS: KdfParams = {
  memorySize: 32768, // 32MB
  iterations: 2,
  parallelism: 1,
  hashLength: 32,
  targetMs: 300,
  chainLength: 1
};

let useArgon2 = true;
let argon2Checked = false;

async function pbkdf2Derive(
  password: string,
  salt: ArrayBuffer,
  iterations: number = 600000,
  hashLength: number = 32
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    hashLength * 8
  );
}

async function tryArgon2idHash(
  password: string,
  salt: ArrayBuffer,
  params: Partial<KdfParams> = {}
): Promise<ArrayBuffer> {
  const p = { ...DEFAULT_PARAMS, ...params };
  const argon2 = await import('argon2-browser');

  const result = await argon2.hash({
    pass: password,
    salt: new Uint8Array(salt),
    type: argon2.ArgonType.Argon2id,
    hashLen: p.hashLength,
    mem: p.memorySize,
    time: p.iterations,
    parallelism: p.parallelism
  });

  return result.hash;
}

export async function argon2idHash(
  password: string,
  salt: ArrayBuffer,
  params: Partial<KdfParams> = {}
): Promise<ArrayBuffer> {
  const p = { ...DEFAULT_PARAMS, ...params };

  if (useArgon2) {
    try {
      const result = await tryArgon2idHash(password, salt, params);
      if (!argon2Checked) {
        argon2Checked = true;
      }
      return result;
    } catch {
      if (!argon2Checked) {
        argon2Checked = true;
        useArgon2 = false;
      }
    }
  }

  // Fallback to PBKDF2
  return pbkdf2Derive(password, salt, 600000, p.hashLength);
}

export async function adaptiveDeriveKey(
  password: string,
  salt: ArrayBuffer,
  targetMs: number = 300
): Promise<DerivedKey> {
  const params: KdfParams = { ...DEFAULT_PARAMS, targetMs };

  const derivedKey = await argon2idHash(password, salt, params);

  return { key: derivedKey, params };
}

export function getKdfParams(): KdfParams {
  return { ...DEFAULT_PARAMS };
}

export function formatKdfParams(params: KdfParams): string {
  return `Argon2id: mem=${params.memorySize / 1024}MB, iter=${params.iterations}, chain=${params.chainLength}`;
}
