const { execSync } = require('child_process');
const fs = require('fs');

const serialFieldHex = "0x28a812e8dc36bbac70d0e5dec38e85061d82c60ac9bfc5404241f222bbe7a631"; // OLD H-2024-BXY-9901
const secret = "99999";
const newSecret = "11111";

const tomlContentHash = `item_serial = "${serialFieldHex}"
old_secret_nonce = "${secret}"
new_secret_nonce = "${newSecret}"
`;
fs.writeFileSync('/Users/hng/Prove_lux/circuits/hash_transfer/Prover.toml', tomlContentHash);

try {
  execSync('export PATH=$HOME/.nargo/bin:$HOME/.bb/bin:$PATH && nargo execute', { cwd: '/Users/hng/Prove_lux/circuits/hash_transfer' });
  const hashOut = JSON.parse(fs.readFileSync('/Users/hng/Prove_lux/circuits/hash_transfer/target/public_inputs_fields.json'));
  console.log('HashTransfer Old:', hashOut[0]);
} catch (e) {
  console.error(e.stdout ? e.stdout.toString() : e);
  console.error(e.stderr ? e.stderr.toString() : e);
}
