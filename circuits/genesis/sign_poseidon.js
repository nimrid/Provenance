const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
const pubKey = wallet.signingKey.publicKey;
const pubKeyXHex = "0x" + pubKey.substring(4, 68);
const pubKeyYHex = "0x" + pubKey.substring(68, 132);

const pubKeyX = Array.from(ethers.getBytes(pubKeyXHex));
const pubKeyY = Array.from(ethers.getBytes(pubKeyYHex));

const messageHashBytes = new Uint8Array([2, 158, 44, 0, 252, 124, 99, 14, 74, 23, 68, 231, 54, 247, 219, 76, 126, 125, 197, 219, 158, 148, 8, 169, 120, 146, 140, 171, 156, 42, 145, 136]);
const messageHashHex = ethers.hexlify(messageHashBytes);

const sig = wallet.signingKey.sign(messageHashHex);
const sigBytes = new Uint8Array(64);
sigBytes.set(ethers.getBytes(sig.r), 0);
sigBytes.set(ethers.getBytes(sig.s), 32);

console.log("pubKeyX:", pubKeyX);
console.log("pubKeyY:", pubKeyY);
console.log("sigBytes:", Array.from(sigBytes));
