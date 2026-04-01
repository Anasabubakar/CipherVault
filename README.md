# CipherVault

**End-to-end encrypted notepad. Your notes, your key, your privacy.**

A modern, self-hostable encrypted notepad that is a superior alternative to ProtectedText.com. All encryption happens client-side using WebCrypto AES-256-GCM — the server never sees your plaintext or password.

## Features

| Feature | CipherVault | ProtectedText |
|---------|-------------|---------------|
| Encryption | WebCrypto AES-256-GCM (native, FIPS-validated) | CryptoJS AES-CBC (JS implementation) |
| Auth | GCM provides integrity (AEAD) | No authentication (vulnerable to tampering) |
| IV | Random 96-bit per encryption | Deterministic (insecure) |
| KDF | Argon2id via WASM (faster) | Argon2id JS implementation |
| Key expansion | HKDF for separate enc/auth keys | Direct key use |
| UI | React 18 + Tailwind CSS | jQuery 2.0.3 |
| Offline | PWA with service worker | None |
| Markdown | Toggle preview with syntax highlighting | Plain text only |
| Hosting | Open-source, Docker self-hostable | Closed-source |
| Mobile | Responsive PWA | Separate Android app |

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start both client and server
npm run dev

# Client: http://localhost:5173
# Server: http://localhost:3001
```

### Docker (Production)

```bash
docker-compose up -d
# Access at http://localhost:3001
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Security Model

### Encryption Flow
```
encrypt(plaintext, password):
  1. siteHash = SHA-256(siteURL)
  2. masterKey = argon2id_chain(password, siteHash, target_ms=300)
  3. encKey = HKDF(masterKey, salt=siteHash, info="enc", 32 bytes)
  4. authKey = HKDF(masterKey, salt=siteHash, info="auth", 32 bytes)
  5. iv = crypto.getRandomValues(12 bytes)
  6. ciphertext = AES-256-GCM(encKey, iv, plaintext + siteHash)
  7. mac = HMAC-SHA-256(authKey, ciphertext)
  8. return base64(iv + ciphertext + mac)
```

### Key Properties
- **Zero knowledge**: The server stores only encrypted blobs
- **Authenticated encryption**: GCM mode detects tampering
- **Random IVs**: Each encryption produces unique ciphertext
- **HKDF key separation**: Different keys for encryption and authentication
- **Adaptive KDF**: Argon2id with chaining targets ~300ms derivation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (PWA)                          │
│  React 18 + Tailwind + WebCrypto + argon2-browser WASM  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   API SERVER                             │
│  Node.js + Express + SQLite (better-sqlite3)            │
└─────────────────────────────────────────────────────────┘
```

## License

MIT
