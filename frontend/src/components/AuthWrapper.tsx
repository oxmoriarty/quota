'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    // If not connected and not connecting, and trying to access protected routes
    if (!isConnected && !isConnecting && pathname !== '/' && pathname !== '/register') {
      router.push('/');
      return;
    }

    if (isConnected && address) {
      const checkUser = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', address.toLowerCase())
          .single();
        
        if (error || !data) {
          setIsRegistered(false);
          if (pathname !== '/register') {
            router.push('/register');
          }
        } else {
          setIsRegistered(true);
          // If on landing or register and already registered, redirect to dashboard
          if (pathname === '/' || pathname === '/register') {
            router.push('/dashboard');
          }
        }
      };
      checkUser();
    }
  }, [isConnected, isConnecting, address, pathname, router]);

  // Handle loading states
  if (isConnecting) return <div style={{ padding: '4rem', textAlign: 'center' }}>Connecting wallet...</div>;
  
  // If connected but we don't know registration status yet
  if (isConnected && isRegistered === null && pathname !== '/') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Verifying account...</div>;
  }

  // If connected and not registered, and not on the register page, don't render children
  if (isConnected && isRegistered === false && pathname !== '/register') {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
