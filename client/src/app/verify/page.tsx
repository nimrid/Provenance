'use client';

import { useState } from 'react';

export default function VerifyPage() {
  const [commitment, setCommitment] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'stolen'>('idle');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    
    try {
      const { server, CONTRACT_ID, hexToBytesN32 } = await import('@/lib/soroban');
      const { Contract } = await import('@stellar/stellar-sdk');
      const contract = new Contract(CONTRACT_ID);
      
      const contractCallOp = contract.call('is_commitment_valid', hexToBytesN32(commitment));
      
      const { TransactionBuilder, Account } = await import('@stellar/stellar-sdk');
      const txValid = new TransactionBuilder(new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"), {
        fee: "100",
        networkPassphrase: "Test SDF Network ; September 2015"
      })
      .addOperation(contractCallOp)
      .setTimeout(30)
      .build();

      const simulatedValid = await server.simulateTransaction(txValid);

      if (simulatedValid.result && simulatedValid.result.retval) {
        const isValid = simulatedValid.result.retval.b();
        
        if (isValid) {
          // If valid, check if it's stolen
          const stolenCallOp = contract.call('is_item_stolen', hexToBytesN32(commitment));
          const txStolen = new TransactionBuilder(new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"), {
            fee: "100",
            networkPassphrase: "Test SDF Network ; September 2015"
          })
          .addOperation(stolenCallOp)
          .setTimeout(30)
          .build();

          const simulatedStolen = await server.simulateTransaction(txStolen);
          const isStolen = simulatedStolen.result?.retval?.b() || false;

          if (isStolen) {
            setStatus('stolen');
          } else {
            setStatus('valid');
          }
        } else {
          setStatus('invalid');
        }
      } else {
        setStatus('invalid');
      }
    } catch (err) {
      console.error(err);
      setStatus('invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
      <h1 className="title">Verify Authenticity</h1>
      <p className="subtitle">Check if a physical item's cryptographic commitment is active on the Soroban smart contract.</p>

      <form onSubmit={handleVerify} className="card" style={{ textAlign: 'left' }}>
        <div className="input-group">
          <label className="input-label">Public Commitment Hash</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="0x..." 
            value={commitment} 
            onChange={e => setCommitment(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading || !commitment} style={{ width: '100%' }}>
          {loading ? <><span className="loader"></span> Querying Soroban State...</> : 'Verify Commitment'}
        </button>
      </form>

      {status === 'valid' && (
        <div className="data-display" style={{ borderColor: 'var(--success)', marginTop: '2rem' }}>
          <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 400 }}>✓ Authentic & Active</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>This commitment hash exists in the Provenance registry and has not been nullified.</p>
        </div>
      )}

      {status === 'invalid' && (
        <div className="data-display" style={{ borderColor: 'red', marginTop: '2rem' }}>
          <h2 style={{ color: 'red', marginBottom: '0.5rem', fontWeight: 400 }}>✗ Invalid or Nullified</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>This commitment hash could not be found or has already been spent in a transfer.</p>
        </div>
      )}

      {status === 'stolen' && (
        <div className="data-display" style={{ borderColor: 'var(--danger)', marginTop: '2rem', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 400 }}>⚠️ REPORTED STOLEN</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>This commitment has been flagged as STOLEN by its true owner. Do not purchase or accept this item.</p>
        </div>
      )}
    </div>
  );
}
