import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

// Secure data encryption using CryptoJS AES
export function encryptData(text: string): string {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

export function decryptData(encryptedText: string): string {
  try {
    // Check if it's CryptoJS encrypted (starts with U2Fsd which is base64 for 'Salted')
    if (encryptedText.startsWith('U2F')) {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || encryptedText;
    }

    // Legacy format with colons - return as-is since old crypto API is deprecated
    if (encryptedText.includes(':')) {
      console.warn('Legacy encrypted format detected, returning as-is');
      return encryptedText;
    }

    return encryptedText; // Return as-is if not encrypted
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
}

// Client-side encryption using CryptoJS (for browser compatibility)
export function encryptUserData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Client encryption failed:', error);
    return data;
  }
}

export function decryptUserData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Client decryption failed:', error);
    return encryptedData;
  }
}

// Admin PIN hashing and verification
export async function hashAdminPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyAdminPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// Generate random password for user reset
export function generateRandomPassword(): string {
  return crypto.randomBytes(12).toString('hex');
}

// Client-side utilities for user ID masking and display

// For display purposes - show only first and last digits with asterisks
export function maskUserId(userId: string): string {
  if (!userId || userId.length < 3) return userId;

  if (userId.length === 6) {
    return `${userId[0]}${'*'.repeat(4)}${userId[5]}`;
  }

  // For other lengths, mask all but first and last character
  if (userId.length > 2) {
    return `${userId[0]}${'*'.repeat(userId.length - 2)}${userId[userId.length - 1]}`;
  }

  return userId.replace(/./g, '*');
}

// Format user ID for display with proper spacing
export function formatUserId(userId: string): string {
  if (!userId) return '';

  // Add spacing for 6-digit IDs: 123456 -> 123 456
  if (userId.length === 6) {
    return `${userId.slice(0, 3)} ${userId.slice(3)}`;
  }

  return userId;
}
