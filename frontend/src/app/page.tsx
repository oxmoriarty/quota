'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useModal } from 'connectkit';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isConnected } = useAccount();
  const { setOpen } = useModal();
  const router = useRouter();

  const handleMainAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConnected) {
      router.push('/dashboard');
    } else {
      setOpen(true);
    }
  };

  return (
    <div className="container main-content">
      <main style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 600, letterSpacing: '-0.04em' }}>
          Hackathon prizes,<br /> distributed fairly.
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Quota is an AI-powered prize allocation platform built on GenLayer. We eliminate arguments over prize distribution with transparent, evidence-based evaluations.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '6rem' }}>
          <button onClick={handleMainAction} style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '1rem',
            border: 'none',
            display: 'inline-block'
          }}>
            {isConnected ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 500 }}>Evidence-based</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Members submit commits, design assets, and research. GenLayer AI evaluates all contributions impartially.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 500 }}>Transparent</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>The AI proposes a detailed reasoning and allocation. Members review, appeal, and finalize consensus on-chain.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 500 }}>Automatic Payouts</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Prizes securely locked in a multi-chain Vault are distributed automatically once consensus is reached.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
