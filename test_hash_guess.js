const crypto = require('crypto');

function stringToFieldHexOld(str) {
  const hash = crypto.createHash('sha256').update(str).digest();
  hash[0] &= 0x3f;
  return '0x' + hash.toString('hex');
}

function stringToFieldHexNew(str) {
  const hash = crypto.createHash('sha256').update(str).digest();
  hash[0] &= 0x1f;
  return '0x' + hash.toString('hex');
}

console.log('H-2024-BXY-9901', stringToFieldHexOld('H-2024-BXY-9901'));
console.log('H-2024-BXY-9902', stringToFieldHexOld('H-2024-BXY-9902'));
