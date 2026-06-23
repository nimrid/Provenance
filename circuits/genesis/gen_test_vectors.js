const crypto = require('crypto');
const { secp256k1 } = require('@noble/curves/secp256k1');

// Generate a random private key
const privKey = crypto.randomBytes(32);
const pubKey = secp256k1.getPublicKey(privKey, false); // uncompressed
const pubKeyX = pubKey.slice(1, 33);
const pubKeyY = pubKey.slice(33, 65);

// Serial number
const itemSerial = 12345n;
let serialBytes = Buffer.alloc(32);
serialBytes.writeBigInt64BE(itemSerial, 24); // just 64-bit for simplicity

// Hash the message
const messageHash = crypto.createHash('sha256').update(serialBytes).digest();

// Sign
const sig = secp256k1.sign(messageHash, privKey);
const sigBytes = new Uint8Array(64);
sigBytes.set(sig.toCompactRawBytes()); // r and s

console.log("pubKeyX:", Array.from(pubKeyX));
console.log("pubKeyY:", Array.from(pubKeyY));
console.log("signature:", Array.from(sigBytes));
console.log("messageHash:", Array.from(messageHash));
