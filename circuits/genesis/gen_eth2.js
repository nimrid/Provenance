const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
const pubKey = wallet.signingKey.publicKey; // 0x04 + 64 hex chars
const pubKeyXHex = "0x" + pubKey.substring(4, 68);
const pubKeyYHex = "0x" + pubKey.substring(68, 132);

const pubKeyX = Array.from(ethers.getBytes(pubKeyXHex));
const pubKeyY = Array.from(ethers.getBytes(pubKeyYHex));

const itemSerial = 12345n;
const serialBytes = new Uint8Array(32);
const view = new DataView(serialBytes.buffer);
view.setBigUint64(24, itemSerial, false); // Big endian

const messageHash = ethers.sha256(serialBytes);
const sig = wallet.signingKey.sign(messageHash);
const sigBytes = new Uint8Array(64);
sigBytes.set(ethers.getBytes(sig.r), 0);
sigBytes.set(ethers.getBytes(sig.s), 32);

console.log("pubKeyX:", pubKeyX);
console.log("pubKeyY:", pubKeyY);
console.log("sigBytes:", Array.from(sigBytes));
console.log("messageHash:", Array.from(ethers.getBytes(messageHash)));
