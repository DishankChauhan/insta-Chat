import { AES, enc } from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key';

export function encryptMessage(message: string): string {
  return AES.encrypt(message, ENCRYPTION_KEY).toString();
}

export function decryptMessage(encryptedMessage: string): string {
  const bytes = AES.decrypt(encryptedMessage, ENCRYPTION_KEY);
  return bytes.toString(enc.Utf8);
}