/*
 * encryption.js
 * Encryption helper functions for Paste It!
 */

// Convert a string to an ArrayBuffer
export function strToArrayBuffer(str) {
  return new TextEncoder().encode(str);
}

// Convert an ArrayBuffer to a Base64 string
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return window.btoa(binary);
}

// Convert a Base64 string to an ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive a key from a password using PBKDF2
export async function deriveKey(password, salt) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    strToArrayBuffer(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt content using AES-GCM (adds a "MAGIC:" prefix for verification)
export async function encryptContent(content, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const payload = "MAGIC:" + content;
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    strToArrayBuffer(payload)
  );

  return {
    encrypted: true,
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv)
  };
}

// Decrypt content using AES-GCM and verify the "MAGIC:" prefix
export async function decryptContent(encryptedData, password) {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    if (!decryptedText.startsWith("MAGIC:")) {
      throw new Error("Incorrect password");
    }
    return decryptedText.slice(6);
  } catch (err) {
    throw new Error("Decryption failed—likely due to an incorrect password.");
  }
}
