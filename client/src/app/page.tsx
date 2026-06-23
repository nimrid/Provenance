import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
      <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>The Future of Authenticity</h1>
      <p className="subtitle" style={{ fontSize: '1.2rem', marginBottom: '4rem' }}>
        Provenance utilizes zero-knowledge proofs on the Stellar network to establish unbreakable, privacy-preserving chains of ownership for luxury goods. Your identity remains hidden. The authenticity remains absolute.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 400 }}>For Manufacturers</h2>
          <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
            Mint the genesis commitment for a physical item. Only the hash of the serial number and a secret nonce is published on-chain.
          </p>
          <Link href="/admin" className="btn">Issue Item</Link>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 400 }}>For Owners</h2>
          <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
            Transfer ownership securely. Generate a zero-knowledge proof locally to update the on-chain registry without revealing your secret.
          </p>
          <Link href="/transfer" className="btn btn-secondary">Transfer Item</Link>
        </div>
      </div>
    </div>
  );
}
