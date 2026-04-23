import crypto from 'crypto';

const ENCRYPTION_VERSION = 1;
const ALGO = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

function getMessageEncryptionKey(): Buffer {
  const raw = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('MESSAGE_ENCRYPTION_KEY не задан (нужен 32-байтный ключ в base64)');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('MESSAGE_ENCRYPTION_KEY должен быть 32 байта в base64 (AES-256)');
  }

  return key;
}

export type EncryptedMessagePayload = {
  encryptionVersion: number;
  textEncrypted: Buffer;
  textIv: Buffer;
  textTag: Buffer;
};

export function encryptMessageText(plaintext: string): EncryptedMessagePayload {
  const key = getMessageEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptionVersion: ENCRYPTION_VERSION,
    textEncrypted: ciphertext,
    textIv: iv,
    textTag: tag,
  };
}

export function decryptMessageText(payload: {
  text?: string | null;
  encryptionVersion?: number | null;
  textEncrypted?: Buffer | null;
  textIv?: Buffer | null;
  textTag?: Buffer | null;
}): string {
  if (payload.text) return payload.text;

  const { textEncrypted, textIv, textTag, encryptionVersion } = payload;
  if (!textEncrypted || !textIv || !textTag) {
    return '';
  }

  if ((encryptionVersion ?? ENCRYPTION_VERSION) !== ENCRYPTION_VERSION) {
    throw new Error('Неподдерживаемая версия шифрования сообщения');
  }

  const key = getMessageEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGO, key, textIv);
  decipher.setAuthTag(textTag);

  const plaintext = Buffer.concat([decipher.update(textEncrypted), decipher.final()]);
  return plaintext.toString('utf8');
}

