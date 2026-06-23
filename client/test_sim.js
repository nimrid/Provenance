import { rpc, xdr, Networks, Contract, TransactionBuilder, Account } from '@stellar/stellar-sdk';

const server = new rpc.Server("https://soroban-testnet.stellar.org:443");
const CONTRACT_ID = "CBB6MRL56MF5CI2IKH2GSPEZIAAR2TXBPNTX6W3AR2EPGRJBDQSVK4LD";

function hexToBytesN32(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buffer = Buffer.from(cleanHex, 'hex');
    return xdr.ScVal.scvBytes(buffer);
}

async function testSimulate() {
    const contract = new Contract(CONTRACT_ID);
    // Let's get the latest network status to have a valid sequence number maybe? Not strictly needed for simulation but sometimes helps
    const account = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
    const commitment = "0x0000000000000000000000000000000000000000000000000000000000000000"; // dummy
    // Let's read the latest commitment from the user's attempt if possible, or just simulate anything
    // Actually, I can just use the user's payload from the logs if needed, but let's test if the simulate call itself fails or returns false correctly.
    const contractCallOp = contract.call('is_commitment_valid', hexToBytesN32(commitment));
    const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET
    })
    .addOperation(contractCallOp)
    .setTimeout(30)
    .build();

    const sim = await server.simulateTransaction(tx);
    console.log(JSON.stringify(sim, null, 2));
}

testSimulate().catch(console.error);
