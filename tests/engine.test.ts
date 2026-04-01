/**
 * Comprehensive tests for the Crypto Engine (AES-256-GCM encrypt/decrypt).
 * Tests roundtrip, error handling, edge cases, and security properties.
 *
 * Uses PBKDF2 fallback when argon2-browser WASM is unavailable (Node.js test env).
 */
import { describe, it, expect } from 'vitest';
import {
  computeSiteHash,
  encrypt,
  decrypt,
  changePassword,
  createEncryptedBlob,
  parseEncryptedBlob
} from '../client/src/crypto/engine';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../client/src/crypto/utils';
import type { EncryptedPayload } from '../client/src/types';

describe('Crypto Engine', () => {
  const TEST_PASSWORD = 'test-password-123!@#';
  const TEST_SITE = 'https://example.com/my-notes';

  describe('Site hash computation', () => {
    it('should produce a base64-encoded SHA-256 hash', async () => {
      const hash = await computeSiteHash('test');
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(hash.length).toBe(44);
    });

    it('should normalize site URL (lowercase, trim)', async () => {
      const hash1 = await computeSiteHash('HTTPS://Example.COM/path  ');
      const hash2 = await computeSiteHash('  https://example.com/path');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different sites', async () => {
      const hash1 = await computeSiteHash('https://site1.com');
      const hash2 = await computeSiteHash('https://site2.com');
      expect(hash1).not.toBe(hash2);
    });

    it('should be consistent for same input', async () => {
      const hash1 = await computeSiteHash('https://test.com');
      const hash2 = await computeSiteHash('https://test.com');
      expect(hash1).toBe(hash2);
    });
  });

  describe('Encrypt/Decrypt roundtrip', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const plaintext = 'Hello, CipherVault!';
      const { payload } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      const decrypted = await decrypt(payload, TEST_PASSWORD, TEST_SITE);
      expect(decrypted).toBe(plaintext);
    }, 30000);

    it('should encrypt and decrypt an empty string', async () => {
      const { payload } = await encrypt('', TEST_PASSWORD, TEST_SITE);
      const decrypted = await decrypt(payload, TEST_PASSWORD, TEST_SITE);
      expect(decrypted).toBe('');
    }, 30000);

    it('should encrypt and decrypt unicode content', async () => {
      const plaintext = '你好世界 🌍 Привет мир';
      const { payload } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      const decrypted = await decrypt(payload, TEST_PASSWORD, TEST_SITE);
      expect(decrypted).toBe(plaintext);
    }, 30000);

    it('should encrypt and decrypt JSON content (tabs)', async () => {
      const tabs = [
        { id: '1', title: 'Notes', content: 'Some encrypted notes here', order: 0 },
        { id: '2', title: 'TODO', content: '- Buy milk\n- Walk dog', order: 1 }
      ];
      const plaintext = JSON.stringify(tabs);
      const { payload } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      const decrypted = await decrypt(payload, TEST_PASSWORD, TEST_SITE);
      expect(JSON.parse(decrypted)).toEqual(tabs);
    }, 30000);

    it('should encrypt and decrypt large content (100KB)', async () => {
      const plaintext = 'x'.repeat(100_000);
      const { payload } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      const decrypted = await decrypt(payload, TEST_PASSWORD, TEST_SITE);
      expect(decrypted).toBe(plaintext);
    }, 30000);

    it('should encrypt and decrypt content with newlines and special chars', async () => {
      const plaintext = 'Line 1\nLine 2\tTab\r\nLine 3';
      const { payload } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      const decrypted = await decrypt(payload, TEST_PASSWORD, TEST_SITE);
      expect(decrypted).toBe(plaintext);
    }, 30000);

    it('should encrypt and decrypt with different passwords', async () => {
      const plaintext = 'secret data';
      const pwd1 = 'password-one';
      const pwd2 = 'password-two';
      const { payload: p1 } = await encrypt(plaintext, pwd1, TEST_SITE);
      const { payload: p2 } = await encrypt(plaintext, pwd2, TEST_SITE);
      expect(p1.ciphertext).not.toBe(p2.ciphertext);
      expect(await decrypt(p1, pwd1, TEST_SITE)).toBe(plaintext);
      expect(await decrypt(p2, pwd2, TEST_SITE)).toBe(plaintext);
    }, 60000);

    it('should encrypt and decrypt with different site URLs', async () => {
      const plaintext = 'same content';
      const { payload: p1 } = await encrypt(plaintext, TEST_PASSWORD, 'https://site1.com');
      const { payload: p2 } = await encrypt(plaintext, TEST_PASSWORD, 'https://site2.com');
      expect(p1.ciphertext).not.toBe(p2.ciphertext);
      expect(await decrypt(p1, TEST_PASSWORD, 'https://site1.com')).toBe(plaintext);
      expect(await decrypt(p2, TEST_PASSWORD, 'https://site2.com')).toBe(plaintext);
    }, 60000);
  });

  describe('Encryption security properties', () => {
    it('should produce different ciphertexts for same plaintext (random IV)', async () => {
      const plaintext = 'identical content';
      const { payload: p1 } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      const { payload: p2 } = await encrypt(plaintext, TEST_PASSWORD, TEST_SITE);
      expect(p1.ciphertext).not.toBe(p2.ciphertext);
      expect(p1.iv).not.toBe(p2.iv);
      expect(p1.mac).not.toBe(p2.mac);
    }, 30000);

    it('should produce 96-bit (12-byte) IV', async () => {
      const { payload } = await encrypt('test', TEST_PASSWORD, TEST_SITE);
      const ivBytes = new Uint8Array(base64ToArrayBuffer(payload.iv));
      expect(ivBytes.length).toBe(12);
    }, 30000);

    it('should produce valid content hash', async () => {
      const { payload } = await encrypt('test', TEST_PASSWORD, TEST_SITE);
      expect(payload.contentHash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    }, 30000);

    it('should produce 32-byte (256-bit) MAC', async () => {
      const { payload } = await encrypt('test', TEST_PASSWORD, TEST_SITE);
      const macBytes = new Uint8Array(base64ToArrayBuffer(payload.mac));
      expect(macBytes.length).toBe(32);
    }, 30000);

    it('should return KDF params after encryption', async () => {
      const { kdfParams } = await encrypt('test', TEST_PASSWORD, TEST_SITE);
      expect(kdfParams).toBeDefined();
      expect(kdfParams.memorySize).toBeGreaterThan(0);
      expect(kdfParams.iterations).toBeGreaterThan(0);
      expect(kdfParams.hashLength).toBe(32);
    }, 30000);
  });

  describe('Decryption error handling', () => {
    it('should fail with wrong password', async () => {
      const { payload } = await encrypt('secret', 'correct-password', TEST_SITE);
      await expect(decrypt(payload, 'wrong-password', TEST_SITE)).rejects.toThrow();
    }, 30000);

    it('should fail with wrong site URL', async () => {
      const { payload } = await encrypt('secret', TEST_PASSWORD, 'https://correct.com');
      await expect(decrypt(payload, TEST_PASSWORD, 'https://wrong.com')).rejects.toThrow();
    }, 30000);

    it('should fail with corrupted ciphertext', async () => {
      const { payload } = await encrypt('secret', TEST_PASSWORD, TEST_SITE);
      const corrupted: EncryptedPayload = {
        ...payload,
        ciphertext: payload.ciphertext.slice(0, -4) + 'AAAA'
      };
      await expect(decrypt(corrupted, TEST_PASSWORD, TEST_SITE)).rejects.toThrow();
    }, 30000);

    it('should fail with corrupted IV', async () => {
      const { payload } = await encrypt('secret', TEST_PASSWORD, TEST_SITE);
      const corrupted: EncryptedPayload = {
        ...payload,
        iv: 'AAAAAAAAAAAAAAAAAAAAAA=='
      };
      await expect(decrypt(corrupted, TEST_PASSWORD, TEST_SITE)).rejects.toThrow();
    }, 30000);

    it('should fail with corrupted MAC', async () => {
      const { payload } = await encrypt('secret', TEST_PASSWORD, TEST_SITE);
      const corrupted: EncryptedPayload = {
        ...payload,
        mac: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      };
      await expect(decrypt(corrupted, TEST_PASSWORD, TEST_SITE)).rejects.toThrow();
    }, 30000);

    it('should fail with empty ciphertext', async () => {
      const fakePayload: EncryptedPayload = {
        iv: arrayBufferToBase64(crypto.getRandomValues(new Uint8Array(12)).buffer),
        ciphertext: '',
        mac: '',
        contentHash: ''
      };
      await expect(decrypt(fakePayload, TEST_PASSWORD, TEST_SITE)).rejects.toThrow();
    });
  });

  describe('Password change', () => {
    it('should change password and still decrypt correctly', async () => {
      const plaintext = 'important data';
      const oldPwd = 'old-password';
      const newPwd = 'new-password';
      const { payload: original } = await encrypt(plaintext, oldPwd, TEST_SITE);
      const { payload: reencrypted } = await changePassword(original, oldPwd, newPwd, TEST_SITE);
      const decrypted = await decrypt(reencrypted, newPwd, TEST_SITE);
      expect(decrypted).toBe(plaintext);
    }, 60000);

    it('should not decrypt with old password after change', async () => {
      const plaintext = 'important data';
      const { payload: original } = await encrypt(plaintext, 'old-pwd', TEST_SITE);
      const { payload: reencrypted } = await changePassword(original, 'old-pwd', 'new-pwd', TEST_SITE);
      await expect(decrypt(reencrypted, 'old-pwd', TEST_SITE)).rejects.toThrow();
    }, 60000);

    it('should fail changePassword with wrong old password', async () => {
      const { payload } = await encrypt('data', 'correct', TEST_SITE);
      await expect(changePassword(payload, 'wrong', 'new', TEST_SITE)).rejects.toThrow();
    }, 30000);
  });

  describe('Encrypted blob serialization', () => {
    it('should create and parse a blob', () => {
      const payload: EncryptedPayload = {
        iv: 'AAAAAAAAAAAAAAAAAAAAAA==',
        ciphertext: 'dGVzdA==',
        mac: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        contentHash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      };
      const blob = createEncryptedBlob(payload);
      const parsed = parseEncryptedBlob(blob);
      expect(parsed.iv).toBe(payload.iv);
      expect(parsed.ciphertext).toBe(payload.ciphertext);
      expect(parsed.mac).toBe(payload.mac);
    });

    it('should fail to parse invalid blob', () => {
      expect(() => parseEncryptedBlob('not-valid-base64!@#$')).toThrow();
    });

    it('should fail to parse blob with missing fields', () => {
      const invalidJson = arrayBufferToBase64(
        new TextEncoder().encode(JSON.stringify({ iv: 'test' })).buffer
      );
      expect(() => parseEncryptedBlob(invalidJson)).toThrow();
    });
  });
});
