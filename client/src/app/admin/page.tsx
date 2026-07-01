'use client';

import { useState } from 'react';
import NFCScanner from '@/components/NFCScanner';

export default function AdminPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ commitment: string, proof: string } | null>(null);
  const [error, setError] = useState('');
  const [onChain, setOnChain] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setOnChain(false);

    try {
      const secret = Math.floor(Math.random() * 1000000).toString();
      const res = await fetch('/api/prove/genesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber, secret }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);

      setResult({ ...data, secret });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setTxStatus('Waiting for wallet signature. Network confirmation may take up to 20 seconds...');
    
    try {
      const { connectWallet, signAndSubmitTransaction, hexToBytesN32, proofToBytes, CONTRACT_ID, networkPassphrase } = await import('@/lib/soroban');
      const { Contract } = await import('@stellar/stellar-sdk');
      
      const publicKey = await connectWallet();
      const contract = new Contract(CONTRACT_ID);
      
      // register_genesis(genesis_commitment: BytesN<32>, proof: Bytes)
      const contractCallOp = contract.call(
        'register_genesis',
        hexToBytesN32(result!.commitment),
        proofToBytes(result!.proof)
      );
      
      const txResult = await signAndSubmitTransaction(contractCallOp, publicKey);
      
      setTxStatus('');
      setTxHash(txResult.hash);
      setOnChain(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Transaction failed');
      setTxStatus('');
    } finally {
      setLoading(false);
      setTxStatus('');
    }
  };

  return (
    <>
    <div className="page-bg" style={{ backgroundImage: 'url(/luxury_handbag.jpg)' }}></div>
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem', position: 'relative', zIndex: 1 }}>
      <h1 className="title">Manufacturer Dashboard</h1>
      <p className="subtitle">Mint a zero-knowledge genesis commitment for a physical item. Enter the hardware serial number below to generate the cryptographic proof.</p>

      <form onSubmit={handleMint} className="card">
        <div className="input-group">
          <label className="input-label">Hardware Serial Number</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. H-2024-BXY-9901" 
            value={serialNumber} 
            onChange={e => setSerialNumber(e.target.value)}
            required
            disabled={loading || !!result}
          />
          <NFCScanner onScan={(serial) => setSerialNumber(serial)} />
        </div>
        
        {!result && (
          <button type="submit" className="btn" disabled={loading || !serialNumber}>
            {loading ? <><span className="loader"></span> Proving...</> : 'Generate Proof'}
          </button>
        )}
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="data-display">
          <div className="badge">Proof Generated</div>
          <div className="data-row">
            <span className="data-label">Generated Secret Nonce (SAVE THIS)</span>
            <span className="data-value">{(result as any).secret}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Public Commitment (On-Chain Hash)</span>
            <span className="data-value">{result.commitment}</span>
          </div>
          <div className="data-row" style={{ marginTop: '1rem' }}>
            <button onClick={handleRegister} className="btn" disabled={loading || onChain} style={{ width: '100%' }}>
              {loading ? <><span className="loader"></span> {txStatus || 'Registering on Soroban...'}</> : 
               onChain ? 'Registered Successfully ✓' : 'Register on Stellar'}
            </button>
            {onChain && txHash && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  View Transaction on Stellar Expert ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
