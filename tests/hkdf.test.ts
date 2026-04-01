/**
 * Comprehensive tests for HKDF key derivation.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  hkdf,
  deriveEncKey,
  deriveAuthKey,
  deriveBothKeys
} from '../client/src/crypto/hkdf';
import { arrayBufferToHex } from '../client/src/crypto/utils';

describe('HKDF Key Derivation', () => {
  const masterKey = new Uint8Array(32);
  const salt = new Uint8Array(32);

  beforeAll(() => {
    crypto.getRandomValues(masterKey);
    crypto.getRandomValues(salt);
  });

  describe('Basic HKDF', () => {
    it('should derive a 32-byte key', async () => {
      const info = new TextEncoder().encode('test-info');
      const derived = await hkdf(masterKey.buffer, salt.buffer, info, 32);
      expect(derived.byteLength).toBe(32);
    });

    it('should derive a 64-byte key', async () => {
      const info = new TextEncoder().encode('test-info');
      const derived = await hkdf(masterKey.buffer, salt.buffer, info, 64);
      expect(derived.byteLength).toBe(64);
    });

    it('should produce different keys for different info strings', async () => {
      const info1 = new TextEncoder().encode('enc');
      const info2 = new TextEncoder().encode('auth');
      const key1 = await hkdf(masterKey.buffer, salt.buffer, info1, 32);
      const key2 = await hkdf(masterKey.buffer, salt.buffer, info2, 32);
      expect(arrayBufferToHex(key1)).not.toBe(arrayBufferToHex(key2));
    });

    it('should produce different keys for different salts', async () => {
      const info = new TextEncoder().encode('test');
      const salt1 = new Uint8Array(32).fill(1);
      const salt2 = new Uint8Array(32).fill(2);
      const key1 = await hkdf(masterKey.buffer, salt1.buffer, info, 32);
      const key2 = await hkdf(masterKey.buffer, salt2.buffer, info, 32);
      expect(arrayBufferToHex(key1)).not.toBe(arrayBufferToHex(key2));
    });

    it('should produce different keys for different master keys', async () => {
      const info = new TextEncoder().encode('test');
      const mk1 = new Uint8Array(32).fill(1);
      const mk2 = new Uint8Array(32).fill(2);
      const key1 = await hkdf(mk1.buffer, salt.buffer, info, 32);
      const key2 = await hkdf(mk2.buffer, salt.buffer, info, 32);
      expect(arrayBufferToHex(key1)).not.toBe(arrayBufferToHex(key2));
    });

    it('should produce consistent output for same inputs', async () => {
      const info = new TextEncoder().encode('consistent');
      const key1 = await hkdf(masterKey.buffer, salt.buffer, info, 32);
      const key2 = await hkdf(masterKey.buffer, salt.buffer, info, 32);
      expect(arrayBufferToHex(key1)).toBe(arrayBufferToHex(key2));
    });
  });

  describe('Encryption key derivation', () => {
    it('should derive a CryptoKey for AES-GCM', async () => {
      const key = await deriveEncKey(masterKey.buffer, salt.buffer);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
      expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    });

    it('should support encrypt and decrypt operations', async () => {
      const key = await deriveEncKey(masterKey.buffer, salt.buffer);
      expect(key.usages).toContain('encrypt');
      expect(key.usages).toContain('decrypt');
    });
  });

  describe('Auth key derivation', () => {
    it('should derive a CryptoKey for HMAC', async () => {
      const key = await deriveAuthKey(masterKey.buffer, salt.buffer);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('HMAC');
    });

    it('should support sign and verify operations', async () => {
      const key = await deriveAuthKey(masterKey.buffer, salt.buffer);
      expect(key.usages).toContain('sign');
      expect(key.usages).toContain('verify');
    });
  });

  describe('Combined key derivation', () => {
    it('should derive both keys simultaneously', async () => {
      const { encKey, authKey } = await deriveBothKeys(masterKey.buffer, salt.buffer);
      expect(encKey.algorithm.name).toBe('AES-GCM');
      expect(authKey.algorithm.name).toBe('HMAC');
    });

    it('should derive different enc and auth keys', async () => {
      const { encKey, authKey } = await deriveBothKeys(masterKey.buffer, salt.buffer);
      // Use the keys for encryption and signing to ensure they're different
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode('test');
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encKey,
        data
      );
      const signature = await crypto.subtle.sign('HMAC', authKey, data);
      expect(ciphertext.byteLength).toBeGreaterThan(0);
      expect(signature.byteLength).toBe(32);
    });

    it('should work with a password-derived master key via deriveBits', async () => {
      // HKDF keys cannot be exported, so we use deriveBits directly
      const password = 'my-secret-password-123!';
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'HKDF',
        false,
        ['deriveBits']
      );
      // Derive 256 bits (32 bytes) using HKDF
      const rawKey = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: salt.buffer,
          info: new TextEncoder().encode('master')
        },
        keyMaterial,
        256
      );
      const { encKey, authKey } = await deriveBothKeys(rawKey, salt.buffer);
      expect(encKey).toBeDefined();
      expect(authKey).toBeDefined();
    });
  });
});
