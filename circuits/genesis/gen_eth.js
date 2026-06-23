const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
const pubKey = wallet.signingKey.publicKey;
const pubKeyX = Array.from(ethers.getBytes(pubKey.slice(0, 66).replace('0x04', '0x')));
const pubKeyY = Array.from(ethers.getBytes('0x' + pubKey.slice(66)));

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
