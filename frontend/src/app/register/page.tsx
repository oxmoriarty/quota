'use client';

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield } from 'lucide-react';

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
      const checkRegistration = async () => {
        const { data } = await supabase
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
        .upsert({
          wallet_address: address?.toLowerCase(),
          username: username.trim()
        }, { onConflict: 'wallet_address' });
        
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface p-6">
      
      <div className="w-full max-w-[500px] flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-surface-container-highest border border-outline-variant rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner">
          <Shield size={32} />
        </div>
        
        <h2 className="text-4xl font-headline font-black tracking-tight mb-4 text-primary">Welcome to Quota</h2>
        <p className="text-on-surface-variant mb-10 text-lg">
          This wallet hasn't been registered yet. Choose a username to enter the ecosystem.
        </p>
        
        <form onSubmit={handleSubmit} className="w-full bg-surface-container-low border border-outline-variant p-8 rounded-2xl shadow-2xl text-left flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-surface-container-highest border border-outline-variant rounded px-4 py-3 text-base w-full focus:outline-none focus:border-primary text-on-surface transition-colors"
              placeholder="e.g. Satoshi"
            />
          </div>
          
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="flex gap-4 mt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-primary text-on-primary py-3 rounded text-sm font-bold hover:bg-opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                  Registering...
                </span>
              ) : 'Complete Registration'}
            </button>
            
            <button 
              type="button" 
              onClick={() => disconnect()} 
              className="px-6 bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded text-sm font-bold hover:bg-surface-variant transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
}
