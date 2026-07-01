require('dotenv').config({ path: '/Users/hng/Prove_lux/client/.env.local' });
const { rpc, Contract, TransactionBuilder, Account, xdr } = require('@stellar/stellar-sdk');

async function main() {
    const server = new rpc.Server("http://localhost:8000", { allowHttp: true });
    const CONTRACT_ID = process.env.NEXT_PUBLIC_PROVENANCE_CONTRACT_ID;
    const contract = new Contract(CONTRACT_ID);
    
    // Some random 32 bytes (64 hex chars)
    const commitment = '04e6a793083783ce7bc659c55e87f81f48dc2f168423eac868907feb59b7e1f8';
    const buffer = Buffer.from(commitment, 'hex');
    const commitmentVal = xdr.ScVal.scvBytes(buffer);

    const contractCallOp = contract.call('is_commitment_valid', commitmentVal);
    const stolenCallOp = contract.call('is_item_stolen', commitmentVal);

    const tx = new TransactionBuilder(new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"), {
        fee: "100",
        networkPassphrase: "Test SDF Network ; September 2015"
    })
    .addOperation(contractCallOp)
    .addOperation(stolenCallOp)
    .setTimeout(30)
    .build();

    try {
        const simulated = await server.simulateTransaction(tx);
        console.log(JSON.stringify(simulated, null, 2));
    } catch(e) {
        console.error(e);
    }
}

main();
