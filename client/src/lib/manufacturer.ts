import { secp256k1 } from '@noble/curves/secp256k1';
import crypto from 'crypto';

// The permanent manufacturer private key for our simulation
export const MANUFACTURER_PRIVATE_KEY = new Uint8Array([93, 28, 140, 125, 5, 213, 10, 155, 58, 23, 235, 11, 218, 21, 203, 166, 5, 180, 122, 237, 135, 95, 26, 17, 112, 48, 226, 163, 253, 189, 63, 115]);

// The simulated mock registry of authorized luxury serial numbers.
export const MANUFACTURER_REGISTRY = new Set([
  'H-2024-BXY-9901', // Hermès format
  'H-2024-BXY-9902',
  'C-1002-YYYY-45A', // Chanel format
  'LV-M44813-0001',  // Louis Vuitton format
]);

import { poseidon2Hash } from './poseidon2'; // We will create a simple wrapper or use a library

export function stringToFieldHex(str: string): string {
  // Hash the string using SHA-256 and truncate to 253 bits to fit safely in a BN254 Field
  const hash = crypto.createHash('sha256').update(str).digest();
  // Set the top 3 bits to 0 to ensure it's < the field modulus (0x30644e72...)
  hash[0] &= 0x1f;
  return '0x' + hash.toString('hex');
}

/**
 * Validates the serial number against the mock registry and returns
 * an ECDSA signature over the Poseidon2 hash of the serial number.
 */
export async function signSerialNumber(serialNumber: string): Promise<{ sigBytes: Uint8Array, serialFieldHex: string }> {
  if (!MANUFACTURER_REGISTRY.has(serialNumber)) {
    throw new Error(`Serial number ${serialNumber} is not found in the authorized manufacturer registry.`);
  }

  const serialFieldHex = stringToFieldHex(serialNumber);
  
  // The circuit converts the serial Field back to 32 bytes via to_be_bytes()
  // Then hashes it using Keccak256.
  const serialBytes = Buffer.from(serialFieldHex.slice(2).padStart(64, '0'), 'hex');
  
  const ethers = await import('ethers');
  const messageHashHex = ethers.keccak256(serialBytes);
  const messageHashBytes = Buffer.from(messageHashHex.slice(2), 'hex');

  // Sign the Keccak256 hash using the permanent private key
  const sig = secp256k1.sign(messageHashBytes, MANUFACTURER_PRIVATE_KEY);
  const sigBytes = new Uint8Array(64);
  sigBytes.set(sig.toCompactRawBytes()); // r and s

  return {
    sigBytes,
    serialFieldHex
  };
}
