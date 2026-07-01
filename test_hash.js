const crypto = require('crypto');

function stringToFieldHex(str) {
  const hash = crypto.createHash('sha256').update(str).digest();
  hash[0] &= 0x1f;
  return '0x' + hash.toString('hex');
}

const serials = [
  'H-2024-BXY-9901',
  'H-2024-BXY-9902',
  'C-1002-YYYY-45A',
  'LV-M44813-0001',
  '12345'
];

for (const s of serials) {
  console.log(s, stringToFieldHex(s));
}
