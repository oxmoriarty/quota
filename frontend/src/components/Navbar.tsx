'use client';

import Link from 'next/link';
import { ConnectKitButton } from 'connectkit';

export function Navbar() {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.5rem 2rem',
      borderBottom: '1px solid var(--border)',
      background: 'var(--background)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em' }}>
          Quota.
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/projects" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Explore Projects</Link>
          <Link href="/how-it-works" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>How it Works</Link>
        </nav>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <ConnectKitButton />
      </div>
    </header>
  );
}
