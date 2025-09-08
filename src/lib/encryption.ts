import CryptoJS from 'crypto-js';

// Basic encryption function
export const encryptContent = (text: string, secret: string): string => {
  if (!text || !secret) return '';
  try {
    return CryptoJS.AES.encrypt(text, secret).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return text; // Return original text if encryption fails
  }
};

// Basic decryption function
export const decryptContent = (ciphertext: string, secret: string): string => {
  if (!ciphertext || !secret) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption results in an empty string, it's likely the secret was wrong
    // or the ciphertext was invalid. Return the original ciphertext.
    if (!originalText) {
        return ciphertext;
    }
    return originalText;
  } catch (error) {
    console.error("Decryption failed:", error);
    return ciphertext; // Return original text if decryption fails
  }
};
