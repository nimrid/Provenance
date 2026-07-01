'use client';

import { useState } from 'react';
import NFCScanner from '@/components/NFCScanner';

export default function ReportStolenPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ commitment: string, proof: string } | null>(null);
  const [error, setError] = useState('');
  const [onChain, setOnChain] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setOnChain(false);

    try {
      const res = await fetch('/api/prove/stolen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber, secret }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);

      setResult(data);
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
      
      // report_stolen(commitment: BytesN<32>, proof: Bytes)
      const contractCallOp = contract.call(
        'report_stolen',
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
    <div className="page-bg" style={{ backgroundImage: 'url(/luxury_watch.jpg)', filter: 'brightness(0.25) contrast(1.1) grayscale(0.8)' }}></div>
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem', position: 'relative', zIndex: 1 }}>
      <h1 className="title" style={{ color: 'red' }}>Report Stolen Item</h1>
      <p className="subtitle">If your luxury item has been stolen, use your private secret to flag it on the blockchain. This will permanently prevent any future transfers of the item.</p>

      <form onSubmit={handleReport} className="card">
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
        <div className="input-group">
          <label className="input-label">Current Secret Nonce</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter your private nonce" 
            value={secret} 
            onChange={e => setSecret(e.target.value)}
            required
            disabled={loading || !!result}
          />
        </div>
        
        {!result && (
          <button type="submit" className="btn" style={{ background: '#d32f2f' }} disabled={loading || !serialNumber || !secret}>
            {loading ? <><span className="loader"></span> Generating Proof...</> : 'Generate Report Stolen Proof'}
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
          <div className="badge" style={{ background: 'rgba(211,47,47,0.1)', color: '#d32f2f' }}>Zero-Knowledge Proof Ready</div>
          
          <div className="data-row">
            <span className="data-label">Public Commitment (Item Identity)</span>
            <span className="data-value">{result.commitment}</span>
          </div>
          
          <div className="data-row" style={{ marginTop: '1.5rem' }}>
            <button onClick={handleRegister} className="btn" style={{ width: '100%', background: onChain ? 'var(--success)' : '#d32f2f' }} disabled={loading || onChain}>
              {loading ? <><span className="loader"></span> {txStatus || 'Submitting to Soroban...'}</> : 
               onChain ? 'Flagged as Stolen ✓' : 'Submit Stolen Report to Stellar'}
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
