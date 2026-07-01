'use client';
import { useState, useEffect } from 'react';

export default function NFCScanner({ onScan }: { onScan: (serial: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if ('NDEFReader' in window) {
      setSupported(true);
    }
  }, []);

  const startScan = async () => {
    setError('');
    try {
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setScanning(true);

      ndef.addEventListener('readingerror', () => {
        setError('Cannot read NFC tag. Try again.');
        setScanning(false);
      });

      ndef.addEventListener('reading', ({ message }: any) => {
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding);
            const serial = textDecoder.decode(record.data);
            onScan(serial);
            setScanning(false);
            return;
          }
        }
        setError('No valid text record found on NFC tag.');
        setScanning(false);
      });
    } catch (err: any) {
      console.error(err);
      setError('NFC Error: ' + err.message);
      setScanning(false);
    }
  };

  if (!supported) {
    return null; // Don't render anything if WebNFC is not supported (e.g. desktop)
  }

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <button 
        type="button" 
        onClick={startScan} 
        className="btn btn-secondary" 
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        disabled={scanning}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8v8c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4H8C5.8 4 4 5.8 4 8z"></path>
          <path d="M9 10a5 5 0 0 1 6 0"></path>
          <path d="M12 14v.01"></path>
        </svg>
        {scanning ? 'Tap Tag to Device...' : 'Tap NFC to Autofill Serial'}
      </button>
      {error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}
    </div>
  );
}
