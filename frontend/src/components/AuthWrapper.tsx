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
    // Public routes that don't need auth protection
    const isPublicRoute = pathname === '/' || pathname === '/how-it-works' || pathname === '/projects';

    // If not connected and not connecting, and trying to access protected routes
    if (!isConnected && !isConnecting && !isPublicRoute && pathname !== '/register') {
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
          // If on register and already registered, redirect to dashboard
          if (pathname === '/register') {
            router.push('/dashboard');
          }
        }
      };
      checkUser();
    }
  }, [isConnected, isConnecting, address, pathname, router]);

  const isPublicRoute = pathname === '/' || pathname === '/how-it-works' || pathname === '/projects';

  // If connected and not registered, and not on the register page or public page, don't render children
  // (This prevents protected content from flashing while the router.push to /register is happening)
  if (isConnected && isRegistered === false && !isPublicRoute && pathname !== '/register') {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
