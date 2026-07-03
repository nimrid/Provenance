import { rpc, xdr, Networks, Contract, Address } from '@stellar/stellar-sdk';
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';

// Setup Testnet RPC
export const server = new rpc.Server("http://localhost:8000", { allowHttp: true });
export const networkPassphrase = Networks.TESTNET;
export const CONTRACT_ID = process.env.NEXT_PUBLIC_PROVENANCE_CONTRACT_ID!;

let kitInstance: StellarWalletsKit | null = null;

export function getStellarWalletsKit() {
    if (!kitInstance) {
        kitInstance = new StellarWalletsKit({
            network: WalletNetwork.TESTNET,
            selectedWalletId: 'freighter',
            modules: allowAllModules(),
        });
    }
    return kitInstance;
}

/**
 * Connect to wallet and return user's public key
 */
export async function connectWallet(): Promise<string> {
    const kit = getStellarWalletsKit();
    return new Promise((resolve, reject) => {
        kit.openModal({
            onWalletSelected: async (option) => {
                try {
                    kit.setWallet(option.id);
                    const { address } = await kit.getAddress();
                    resolve(address);
                } catch (e) {
                    reject(e);
                }
            },
            onClosed: (err) => {
                reject(err || new Error("Wallet connection was cancelled by the user."));
            }
        });
    });
}

/**
 * Sign and submit a transaction using the connected wallet
 */
export async function signAndSubmitTransaction(contractCallOp: xdr.Operation, publicKey: string) {
    const { TransactionBuilder } = await import('@stellar/stellar-sdk');
    const kit = getStellarWalletsKit();
    
    // Get account to get sequence number
    const account = await server.getAccount(publicKey);
    
    // Build the initial transaction
    const tx = new TransactionBuilder(account, {
        fee: "100000", // Will be simulated and overwritten by prepareTransaction
        networkPassphrase: networkPassphrase
    })
    .addOperation(contractCallOp)
    .setTimeout(300)
    .build();
    
    // Soroban requires preparing the transaction to fetch storage footprint
    const preparedTx = await server.prepareTransaction(tx);
    
    // Request signature from the wallet
    const signedTxResponse = await kit.signTransaction(preparedTx.toXDR(), {
        networkPassphrase: networkPassphrase,
        address: publicKey
    });
    
    const signedTxXdr = signedTxResponse.signedTxXdr;
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase) as any;
    
    // Send to network
    const sendResponse = await server.sendTransaction(signedTx);
    
    if (sendResponse.status === 'ERROR') {
        throw new Error("Transaction submission failed: " + JSON.stringify(sendResponse.errorResult));
    }
    
    // Wait for confirmation using raw JSON-RPC to avoid XDR parsing errors (Bad union switch) on new Protocol versions
    let getTxStatus = async () => {
        const res = await fetch("http://localhost:8000", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getTransaction",
                params: { hash: sendResponse.hash }
            })
        });
        const data = await res.json();
        return data.result;
    };

    let statusResult = await getTxStatus();
    while (statusResult.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        statusResult = await getTxStatus();
    }
    
    if (statusResult.status === 'FAILED') {
        throw new Error("Transaction execution failed on chain: " + JSON.stringify(statusResult.resultXdr));
    }
    
    return { ...statusResult, hash: sendResponse.hash };
}

/**
 * Utility to convert hex strings to Soroban BytesN<32>
 */
export function hexToBytesN32(hex: string): xdr.ScVal {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buffer = Buffer.from(cleanHex, 'hex');
    if (buffer.length !== 32) throw new Error("Expected 32 bytes for BytesN<32>");
    return xdr.ScVal.scvBytes(buffer);
}

/**
 * Utility to convert base64 (or hex) proof to Soroban Bytes
 */
export function proofToBytes(proofStr: string): xdr.ScVal {
    // If it's hex, strip the '0x' prefix if present
    const cleanHex = proofStr.startsWith('0x') ? proofStr.slice(2) : proofStr;
    const buffer = Buffer.from(cleanHex, 'hex');
    return xdr.ScVal.scvBytes(buffer);
}
