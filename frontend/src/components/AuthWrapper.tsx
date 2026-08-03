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
          // If on landing or register and already registered, redirect to dashboard
          if (pathname === '/' || pathname === '/register') {
            router.push('/dashboard');
          }
        }
      };
      checkUser();
    }
  }, [isConnected, isConnecting, address, pathname, router]);

  const isPublicRoute = pathname === '/' || pathname === '/how-it-works' || pathname === '/projects';

  // Handle loading states for protected routes ONLY
  if (isConnecting && !isPublicRoute) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] space-y-4">
         <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
         <p className="text-sm text-on-surface-variant font-medium animate-pulse tracking-widest uppercase">Connecting Wallet</p>
      </div>
    );
  }
  
  // If connected but we don't know registration status yet, and trying to access a protected route
  if (isConnected && isRegistered === null && !isPublicRoute && pathname !== '/register') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] space-y-4">
         <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
         <p className="text-sm text-on-surface-variant font-medium animate-pulse tracking-widest uppercase">Verifying Account</p>
      </div>
    );
  }

  // If connected and not registered, and not on the register page or public page, don't render children
  if (isConnected && isRegistered === false && !isPublicRoute && pathname !== '/register') {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
