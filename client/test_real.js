import { rpc, xdr, Networks, Contract, TransactionBuilder, Account } from '@stellar/stellar-sdk';

const server = new rpc.Server("https://soroban-testnet.stellar.org:443");
const CONTRACT_ID = "CBB6MRL56MF5CI2IKH2GSPEZIAAR2TXBPNTX6W3AR2EPGRJBDQSVK4LD";

function hexToBytesN32(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buffer = Buffer.from(cleanHex, 'hex');
    return xdr.ScVal.scvBytes(buffer);
}

async function checkReal() {
    const contract = new Contract(CONTRACT_ID);
    const account = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
    const commitment = "029993e8756cea5691e9c1433852342277b7dcce1c02c1f44e4b1b1b53913067"; 
    const contractCallOp = contract.call('is_commitment_valid', hexToBytesN32(commitment));
    const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET
    })
    .addOperation(contractCallOp)
    .setTimeout(30)
    .build();

    const sim = await server.simulateTransaction(tx);
    console.log(JSON.stringify(sim.result, null, 2));
}

checkReal().catch(console.error);
