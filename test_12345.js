const { execSync } = require('child_process');
const fs = require('fs');

const serialFieldHex = "0x1994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"; // 12345
const secret = "99999";

const tomlContentHash = `item_serial = "${serialFieldHex}"
old_secret_nonce = "${secret}"
new_secret_nonce = "11111"
`;
fs.writeFileSync('/Users/hng/Prove_lux/circuits/hash_transfer/Prover.toml', tomlContentHash);

try {
  execSync('export PATH=$HOME/.nargo/bin:$HOME/.bb/bin:$PATH && nargo execute', { cwd: '/Users/hng/Prove_lux/circuits/hash_transfer' });
  const hashOut = JSON.parse(fs.readFileSync('/Users/hng/Prove_lux/circuits/hash_transfer/target/public_inputs_fields.json'));
  console.log('HashTransfer 12345:', hashOut[0]);
} catch (e) {
  console.error(e);
}
