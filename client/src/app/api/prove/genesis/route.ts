import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { serialNumber, secret, authenticatorSignature } = await request.json();

    if (!serialNumber || !secret || !authenticatorSignature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Create a temporary directory for this proving run
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prove-genesis-'));
    const circuitDir = path.join(tmpDir, 'genesis');

    // 2. Copy the genesis circuit to the temporary directory
    const sourceDir = path.resolve(process.cwd(), '../circuits/genesis');
    await execAsync(`cp -r ${sourceDir} ${circuitDir}`);

    // 3. Write the Prover.toml
    const tomlContent = `item_serial = "${serialNumber}"
secret_nonce = "${secret}"
authenticator_signature = [${authenticatorSignature.join(', ')}]
`;
    await fs.writeFile(path.join(circuitDir, 'Prover.toml'), tomlContent);

    // Setup ENV for Noir and Barretenberg
    const execEnv = { 
        ...process.env, 
        PATH: `${os.homedir()}/.nargo/bin:${os.homedir()}/.bb/bin:${process.env.PATH || ''}` 
    };

    // 4. Run nargo execute
    await execAsync(`nargo execute`, { cwd: circuitDir, env: execEnv });

    // 5. Generate the UltraHonk proof using bb
    await execAsync(`bb prove --scheme ultra_honk --oracle_hash keccak --bytecode_path target/genesis.json --witness_path target/genesis.gz --output_path target --output_format bytes_and_fields`, { cwd: circuitDir, env: execEnv });

    // 6. Read the generated proof
    const proofPath = path.join(circuitDir, 'target/proof');
    const proofBuffer = await fs.readFile(proofPath);
    
    // 7. Extract the commitment
    // In genesis, the commitment is a public input (returned by the circuit).
    const publicInputsPath = path.join(circuitDir, 'target/public_inputs_fields.json');
    const publicInputsStr = await fs.readFile(publicInputsPath, 'utf8');
    const publicInputs = JSON.parse(publicInputsStr);
    
    const commitmentHex = publicInputs[0];
    
    // The ultrahonk-soroban-verifier expects the FULL proof buffer including public inputs (14592 bytes)
    const actualProofBuffer = proofBuffer;
    const proofHex = '0x' + actualProofBuffer.toString('hex');

    // Cleanup temp dir asynchronously (fire and forget)
    fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);

    return NextResponse.json({
      commitment: commitmentHex,
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
