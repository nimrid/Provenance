'use client';

import { useState } from 'react';

export default function TransferPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [oldSecret, setOldSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ newSecret: string, oldCommitment: string, newCommitment: string, nullifier: string, proof: string } | null>(null);
  const [error, setError] = useState('');
  const [onChain, setOnChain] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setOnChain(false);

    try {
      // Simulate generating a new secret for the new owner
      const newSecret = Math.floor(Math.random() * 1000000).toString();

      const res = await fetch('/api/prove/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber, oldSecret, newSecret }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);

      setResult({ ...data, newSecret });
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
      const { connectWallet, signAndSubmitTransaction, hexToBytesN32, proofToBytes, CONTRACT_ID } = await import('@/lib/soroban');
      const { Contract } = await import('@stellar/stellar-sdk');
      
      const publicKey = await connectWallet();
      const contract = new Contract(CONTRACT_ID);
      
      // process_transfer(old_commitment: BytesN<32>, new_commitment: BytesN<32>, nullifier: BytesN<32>, proof: Bytes)
      const contractCallOp = contract.call(
        'process_transfer',
        hexToBytesN32(result!.oldCommitment),
        hexToBytesN32(result!.newCommitment),
        hexToBytesN32(result!.nullifier),
        proofToBytes(result!.proof)
      );
      
      await signAndSubmitTransaction(contractCallOp, publicKey);
      
      setTxStatus('');
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
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1 className="title">Transfer Ownership</h1>
      <p className="subtitle">Execute a zero-knowledge transfer. Prove you own the current secret and generate a new commitment for the buyer without revealing the item's identity.</p>

      <form onSubmit={handleTransfer} className="card">
        <div className="input-group">
          <label className="input-label">Hardware Serial Number</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. 123456789" 
            value={serialNumber} 
            onChange={e => setSerialNumber(e.target.value)}
            required
            disabled={loading || !!result}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Current Secret Nonce</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter your private nonce" 
            value={oldSecret} 
            onChange={e => setOldSecret(e.target.value)}
            required
            disabled={loading || !!result}
          />
        </div>
        
        {!result && (
          <button type="submit" className="btn" disabled={loading || !serialNumber || !oldSecret}>
            {loading ? <><span className="loader"></span> Proving Transfer...</> : 'Initiate Transfer'}
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
            <span className="data-label">New Secret Nonce (For Buyer)</span>
            <span className="data-value" style={{ color: 'var(--success)' }}>{result.newSecret}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '1rem 0' }}></div>

          <div className="data-row">
            <span className="data-label">Public Nullifier (Spends Old Hash)</span>
            <span className="data-value">{result.nullifier}</span>
          </div>
          <div className="data-row">
            <span className="data-label">New Public Commitment</span>
            <span className="data-value">{result.newCommitment}</span>
          </div>
          
          <div className="data-row" style={{ marginTop: '1.5rem' }}>
            <button onClick={handleRegister} className="btn" disabled={loading || onChain} style={{ width: '100%' }}>
              {loading ? <><span className="loader"></span> {txStatus || 'Registering Transfer on Soroban...'}</> : 
               onChain ? 'Transferred Successfully ✓' : 'Register Transfer on Stellar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
