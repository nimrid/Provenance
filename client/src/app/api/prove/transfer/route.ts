import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  let tmpDir: string | null = null;
  try {
    const { serialNumber, oldSecret, newSecret } = await request.json();

    if (!serialNumber || !oldSecret || !newSecret) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { stringToFieldHex } = await import('@/lib/manufacturer');
    const serialFieldHex = stringToFieldHex(serialNumber);

    const execEnv = { 
        ...process.env, 
        PATH: `${os.homedir()}/.nargo/bin:${os.homedir()}/.bb/bin:${process.env.PATH || ''}` 
    };

    // 1. Create a temporary directory
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prove-transfer-'));
    
    // --- STEP A: Compute Hashes using Noir ---
    const hashCircuitDir = path.join(tmpDir, 'hash_transfer');
    const sourceHashDir = path.resolve(process.cwd(), '../circuits/hash_transfer');
    await execAsync(`cp -r ${sourceHashDir} ${hashCircuitDir}`);

    const hashToml = `item_serial = "${serialFieldHex}"
old_secret_nonce = "${oldSecret}"
new_secret_nonce = "${newSecret}"
`;
    await fs.writeFile(path.join(hashCircuitDir, 'Prover.toml'), hashToml);

    await execAsync(`nargo execute`, { cwd: hashCircuitDir, env: execEnv });
    await execAsync(`bb prove --scheme ultra_honk --oracle_hash keccak --bytecode_path target/hash_transfer.json --witness_path target/hash_transfer.gz --output_path target --output_format bytes_and_fields`, { cwd: hashCircuitDir, env: execEnv });

    const hashPublicInputsStr = await fs.readFile(path.join(hashCircuitDir, 'target/public_inputs_fields.json'), 'utf8');
    const hashPublicInputs = JSON.parse(hashPublicInputsStr);
    
    const oldCommitment = hashPublicInputs[0];
    const newCommitment = hashPublicInputs[1];
    const nullifier = hashPublicInputs[2];


    // --- STEP B: Generate Transfer Proof ---
    const transferCircuitDir = path.join(tmpDir, 'transfer');
    const sourceTransferDir = path.resolve(process.cwd(), '../circuits/transfer');
    await execAsync(`cp -r ${sourceTransferDir} ${transferCircuitDir}`);

    const transferToml = `item_serial = "${serialFieldHex}"
old_secret_nonce = "${oldSecret}"
new_secret_nonce = "${newSecret}"
old_commitment = "${oldCommitment}"
new_commitment = "${newCommitment}"
nullifier = "${nullifier}"
`;
    await fs.writeFile(path.join(transferCircuitDir, 'Prover.toml'), transferToml);

    await execAsync(`nargo execute`, { cwd: transferCircuitDir, env: execEnv });
    await execAsync(`bb prove --scheme ultra_honk --oracle_hash keccak --bytecode_path target/transfer.json --witness_path target/transfer.gz --output_path target --output_format bytes_and_fields`, { cwd: transferCircuitDir, env: execEnv });

    const proofPath = path.join(transferCircuitDir, 'target/proof');
    const proofBuffer = await fs.readFile(proofPath);
    
    // The ultrahonk-soroban-verifier expects the FULL proof buffer including public inputs
    const actualProofBuffer = proofBuffer;
    const proofHex = '0x' + actualProofBuffer.toString('hex');

    // Cleanup temp dir happens in finally block

    return NextResponse.json({
      oldCommitment,
      newCommitment,
      nullifier,
      proof: proofHex
    });

  } catch (error: any) {
    console.error('Proving error:', error.message || error);
    return NextResponse.json(
      { error: 'Proof generation failed', details: error.message },
      { status: 500 }
    );
  } finally {
    if (tmpDir) {
      fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
    }
  }
}
