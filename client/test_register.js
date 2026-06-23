import { rpc, xdr, Networks, Contract, TransactionBuilder, Account } from '@stellar/stellar-sdk';
import { readFileSync } from 'fs';

const server = new rpc.Server("https://soroban-testnet.stellar.org:443");
const CONTRACT_ID = "CBB6MRL56MF5CI2IKH2GSPEZIAAR2TXBPNTX6W3AR2EPGRJBDQSVK4LD";

function hexToBytesN32(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buffer = Buffer.from(cleanHex, 'hex');
    return xdr.ScVal.scvBytes(buffer);
}

function proofToBytes(proofStr) {
    const cleanHex = proofStr.startsWith('0x') ? proofStr.slice(2) : proofStr;
    const buffer = Buffer.from(cleanHex, 'hex');
    return xdr.ScVal.scvBytes(buffer);
}

async function simRegister() {
    try {
        const payload = JSON.parse(readFileSync('/tmp/proof_resp2.json', 'utf8'));
        const commitment = payload.commitment;
        const proof = payload.proof;

        const contract = new Contract(CONTRACT_ID);
        const account = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
        const contractCallOp = contract.call('register_genesis', hexToBytesN32(commitment), proofToBytes(proof));
        const tx = new TransactionBuilder(account, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(contractCallOp)
        .setTimeout(30)
        .build();

        const sim = await server.simulateTransaction(tx);
        console.log("Simulate Result:", JSON.stringify(sim, null, 2));
    } catch(e) {
        console.error(e);
    }
}

simRegister();
