import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { serialNumber, secret } = await request.json();

    if (!serialNumber || !secret) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { stringToFieldHex } = await import('@/lib/manufacturer');
    const serialFieldHex = stringToFieldHex(serialNumber);

    const execEnv = { 
        ...process.env, 
        PATH: `${os.homedir()}/.nargo/bin:${os.homedir()}/.bb/bin:${process.env.PATH || ''}` 
    };

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prove-stolen-'));
    
    // --- STEP A: Compute Hash (commitment) using a simple Node.js script or the genesis hash circuit ---
    // Actually, we can just run the report_stolen circuit directly! BUT we need the commitment as public input.
    // We can use a short Noir script or the genesis circuit to compute it, or we can compute it if we have a small hash script.
    // The genesis circuit computes commitment from serial and secret! Let's just use genesis to get the hash!
    const hashCircuitDir = path.join(tmpDir, 'hash_transfer');
    const sourceHashDir = path.resolve(process.cwd(), '../circuits/hash_transfer');
    await execAsync(`cp -r ${sourceHashDir} ${hashCircuitDir}`);

    const hashToml = `item_serial = "${serialFieldHex}"
old_secret_nonce = "${secret}"
new_secret_nonce = "0"
`;
    await fs.writeFile(path.join(hashCircuitDir, 'Prover.toml'), hashToml);

    await execAsync(`nargo execute`, { cwd: hashCircuitDir, env: execEnv });
    await execAsync(`bb prove --scheme ultra_honk --oracle_hash keccak --bytecode_path target/hash_transfer.json --witness_path target/hash_transfer.gz --output_path target --output_format bytes_and_fields`, { cwd: hashCircuitDir, env: execEnv });

    const hashPublicInputsStr = await fs.readFile(path.join(hashCircuitDir, 'target/public_inputs_fields.json'), 'utf8');
    const hashPublicInputs = JSON.parse(hashPublicInputsStr);
    
    const commitment = hashPublicInputs[0];

    // --- STEP B: Generate Report Stolen Proof ---
    const stolenCircuitDir = path.join(tmpDir, 'report_stolen');
    const sourceStolenDir = path.resolve(process.cwd(), '../circuits/report_stolen');
    await execAsync(`cp -r ${sourceStolenDir} ${stolenCircuitDir}`);

    const stolenToml = `item_serial = "${serialFieldHex}"
secret_nonce = "${secret}"
commitment = "${commitment}"
`;
    await fs.writeFile(path.join(stolenCircuitDir, 'Prover.toml'), stolenToml);

    await execAsync(`nargo execute`, { cwd: stolenCircuitDir, env: execEnv });
    await execAsync(`bb prove --scheme ultra_honk --oracle_hash keccak --bytecode_path target/report_stolen.json --witness_path target/report_stolen.gz --output_path target --output_format bytes_and_fields`, { cwd: stolenCircuitDir, env: execEnv });

    const proofPath = path.join(stolenCircuitDir, 'target/proof');
    const proofBuffer = await fs.readFile(proofPath);
    
    const actualProofBuffer = proofBuffer;
    const proofHex = '0x' + actualProofBuffer.toString('hex');

    // Cleanup temp dir
    fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);

    return NextResponse.json({
      commitment,
      proof: proofHex
    });

  } catch (error: any) {
    console.error('Proving error:', error);
    return NextResponse.json(
      { error: 'Proof generation failed', details: error.message },
      { status: 500 }
    );
  }
}
