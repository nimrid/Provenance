import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', textAlign: 'center', padding: '0 1rem' }}>
      
      <div style={{ position: 'relative', width: '100%', height: '450px', marginBottom: '3rem', borderRadius: '12px', overflow: 'hidden' }}>
        <Image 
          src="/luxury_watch.jpg" 
          alt="Luxury Watch" 
          fill 
          style={{ objectFit: 'cover' }} 
          priority 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}></div>
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '2.5rem', textAlign: 'left' }}>
          <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '1rem', textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>The Future of Authenticity</h1>
          <p className="subtitle" style={{ fontSize: '1.2rem', maxWidth: '700px', color: '#f0f0f0', textShadow: '0 2px 8px rgba(0,0,0,0.8)', margin: 0 }}>
            Provenance utilizes zero-knowledge proofs on the Stellar network to establish unbreakable, privacy-preserving chains of ownership for luxury goods. Your identity remains hidden. The authenticity remains absolute.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ textAlign: 'left' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', width: '100%', height: '220px', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <Image 
              src="/luxury_handbag.jpg" 
              alt="Luxury Handbag" 
              fill 
              style={{ objectFit: 'cover' }} 
            />
          </div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 500 }}>For Manufacturers</h2>
          <p className="subtitle" style={{ fontSize: '0.95rem', marginBottom: '2rem', flexGrow: 1 }}>
            Mint the genesis commitment for a physical item. Only the hash of the serial number and a secret nonce is published on-chain.
          </p>
          <div style={{ marginTop: 'auto' }}>
            <Link href="/admin" className="btn" style={{ display: 'block', textAlign: 'center' }}>Issue Item</Link>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', width: '100%', height: '220px', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
             <Image 
              src="/luxury_watch.jpg" 
              alt="Luxury Watch" 
              fill 
              style={{ objectFit: 'cover', filter: 'brightness(0.8)' }} 
            />
          </div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 500 }}>For Owners</h2>
          <p className="subtitle" style={{ fontSize: '0.95rem', marginBottom: '2rem', flexGrow: 1 }}>
            Transfer ownership securely. Generate a zero-knowledge proof locally to update the on-chain registry without revealing your secret.
          </p>
          <div className="action-buttons">
            <Link href="/transfer" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center' }}>Transfer Item</Link>
            <Link href="/stolen" className="btn" style={{ display: 'block', textAlign: 'center', background: '#d32f2f' }}>Report Stolen</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
