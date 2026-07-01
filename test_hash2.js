const { execSync } = require('child_process');
const fs = require('fs');

const serialFieldHex = "0x08a812e8dc36bbac70d0e5dec38e85061d82c60ac9bfc5404241f222bbe7a631"; // H-2024-BXY-9901
const secret = "99999";
const newSecret = "11111";

// Mock signature bytes
const sigBytes = [96, 216, 32, 173, 28, 122, 207, 54, 211, 159, 167, 139, 251, 47, 130, 230, 85, 190, 80, 60, 176, 9, 113, 21, 16, 125, 96, 106, 27, 219, 248, 151, 34, 175, 83, 121, 128, 242, 136, 246, 94, 165, 11, 224, 229, 218, 3, 167, 241, 216, 147, 254, 240, 209, 71, 162, 188, 224, 90, 75, 56, 181, 127, 237];

const tomlContentGenesis = `item_serial = "${serialFieldHex}"
secret_nonce = "${secret}"
authenticator_signature = [${sigBytes.join(', ')}]
`;
fs.writeFileSync('/Users/hng/Prove_lux/circuits/genesis/Prover.toml', tomlContentGenesis);

const tomlContentHash = `item_serial = "${serialFieldHex}"
old_secret_nonce = "${secret}"
new_secret_nonce = "${newSecret}"
`;
fs.writeFileSync('/Users/hng/Prove_lux/circuits/hash_transfer/Prover.toml', tomlContentHash);

try {
  execSync('export PATH=$HOME/.nargo/bin:$HOME/.bb/bin:$PATH && nargo execute', { cwd: '/Users/hng/Prove_lux/circuits/genesis' });
  const genesisOut = JSON.parse(fs.readFileSync('/Users/hng/Prove_lux/circuits/genesis/target/public_inputs_fields.json'));
  console.log('Genesis:', genesisOut[0]);

  execSync('export PATH=$HOME/.nargo/bin:$HOME/.bb/bin:$PATH && nargo execute', { cwd: '/Users/hng/Prove_lux/circuits/hash_transfer' });
  const hashOut = JSON.parse(fs.readFileSync('/Users/hng/Prove_lux/circuits/hash_transfer/target/public_inputs_fields.json'));
  console.log('HashTransfer Old:', hashOut[0]);
} catch (e) {
  console.error(e.stdout ? e.stdout.toString() : e);
  console.error(e.stderr ? e.stderr.toString() : e);
}
