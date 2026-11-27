import crypto from 'crypto';

const DEFAULT_DEV_KEY_HEX =
  '4b6f9a2e1c8d7f3b5a0e9d4c2b8f6a1e3c5d7b9f0a2c4e6d8b1a3f5c7e9d0b2a';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  alg: 'AES-256-GCM';
}

function getKeyBuffer(keyId: string): Buffer {
  const activeKeyId = process.env.GRANT_ENCRYPTION_KEY_ID || 'v1';
  if (keyId === activeKeyId) {
    const hex = process.env.GRANT_ENCRYPTION_KEY_V1 || DEFAULT_DEV_KEY_HEX;
    return Buffer.from(hex.padEnd(64, '0').slice(0, 64), 'hex');
  }
  const prevHex = process.env.GRANT_ENCRYPTION_KEY_PREVIOUS || DEFAULT_DEV_KEY_HEX;
  return Buffer.from(prevHex.padEnd(64, '0').slice(0, 64), 'hex');
}

export function encryptSecret(plaintext: string, aadContext = 'daoz360-grant'): EncryptedPayload {
  const keyId = process.env.GRANT_ENCRYPTION_KEY_ID || 'v1';
  const key = getKeyBuffer(keyId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(aadContext, 'utf8'));

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyId,
    alg: 'AES-256-GCM',
  };
}

export function decryptSecret(payload: EncryptedPayload, aadContext = 'daoz360-grant'): string {
  const key = getKeyBuffer(payload.keyId);
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(aadContext, 'utf8'));
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function rotateEncryptedSecret(payload: EncryptedPayload, aadContext = 'daoz360-grant'): EncryptedPayload {
  const plain = decryptSecret(payload, aadContext);
  return encryptSecret(plain, aadContext);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2_sha512$10000$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha512') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expected = parts[3];
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expected, 'hex'));
}

export function signToken(payload: Record<string, unknown>): string {
  const secret = process.env.AUTH_SECRET || 'daoz360_dev_auth_secret_replace_in_prod_32b';
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySignedToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const secret = process.env.AUTH_SECRET || 'daoz360_dev_auth_secret_replace_in_prod_32b';
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function generateRandomState(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function maskSecret(value: string | undefined | null): string {
  if (!value) return 'Not configured';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function generateTotpCode(secret: string, windowOffset = 0): string {
  const epoch = Math.floor(Date.now() / 1000 / 30) + windowOffset;
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(epoch), 0);
  const key = Buffer.from(secret, 'utf8');
  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1000000;
  return code.toString().padStart(6, '0');
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const normalized = (code || '').trim();
  if (!/^\d{6}$/.test(normalized)) return false;
  for (const offset of [-1, 0, 1]) {
    if (generateTotpCode(secret, offset) === normalized) {
      return true;
    }
  }
  return false;
}
