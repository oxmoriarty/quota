'use client';

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      // Check if already registered
      const checkRegistration = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address?.toLowerCase())
          .single();
        
        if (data) {
          router.push('/dashboard');
        }
      };
      checkRegistration();
    }
  }, [isConnected, address, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check uniqueness
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('username', username)
        .single();
        
      if (existingUser) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: address?.toLowerCase(),
          username: username.trim()
        });
        
      if (insertError) throw insertError;
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="container main-content" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>Welcome to Quota</h2>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '3rem' }}>
        It looks like this wallet hasn't been registered yet. Please choose a username.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', backgroundColor: 'var(--card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
              fontSize: '1rem'
            }}
            placeholder="e.g. Satoshi"
          />
        </div>
        
        {error && <div style={{ color: 'var(--destructive)', fontSize: '0.9rem' }}>{error}</div>}
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" disabled={loading} style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '1rem',
            border: 'none',
            flex: 1,
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
          
          <button type="button" onClick={() => disconnect()} style={{
            backgroundColor: 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '1rem',
            border: '1px solid var(--border)',
          }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
