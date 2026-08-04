'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Clock, Settings, FileText, HelpCircle, Plus } from 'lucide-react';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { useModal } from 'connectkit';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/Avatar';

export function Sidebar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { setOpen } = useModal();
  const [userProfile, setUserProfile] = useState<{username?: string, avatar_url?: string} | null>(null);

  useEffect(() => {
    if (address) {
      supabase.from('users').select('username, avatar_url').eq('wallet_address', address.toLowerCase()).single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [address]);

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant flex flex-col p-4 space-y-6 z-20">
      {/* Brand / Header */}
      <Link href="/" className="flex items-center px-2 group">
        <div className="flex items-center justify-center transition-transform group-hover:scale-105">
          <Image src="/quotalogo.svg" alt="Quota Logo" width={140} height={48} className="drop-shadow-lg object-contain w-auto h-12" priority />
        </div>
      </Link>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-1">
        <div className="px-2 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider opacity-50">Workspace</div>
        
        <Link href="/dashboard" className={`flex items-center space-x-3 p-2 rounded-lg transition-colors duration-150 cursor-pointer active:scale-[0.98] ${isActive('/dashboard') ? 'text-primary font-bold bg-secondary-container/30' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'}`}>
          <Rocket size={20} />
          <span className="font-body text-label-medium antialiased">Active Projects</span>
        </Link>
      </nav>

      {/* CTA */}
      <Link href="/create" className="w-full bg-primary text-on-primary font-bold py-2.5 rounded hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer">
        <Plus size={16} />
        <span>New Project</span>
      </Link>

      {/* Footer Tabs */}
      <footer className="pt-4 border-t border-outline-variant space-y-1">
        <Link href="/how-it-works" className="flex items-center space-x-3 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors duration-150 cursor-pointer">
          <FileText size={20} />
          <span className="font-body text-label-medium">Documentation</span>
        </Link>
        
        <div 
          onClick={() => setOpen(true)}
          className="flex items-center space-x-3 p-2 mt-4 rounded-lg bg-surface-container-low hover:bg-surface-bright border border-outline-variant cursor-pointer transition-all active:scale-[0.98] group"
        >
          {address ? (
            <>
              <Avatar url={userProfile?.avatar_url} username={userProfile?.username} size={28} />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                  {userProfile?.username || 'Unnamed'}
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant truncate">
                  {`${address.substring(0,6)}...${address.substring(38)}`}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3 w-full">
              <div className="w-7 h-7 rounded-full bg-surface-bright border border-outline-variant flex items-center justify-center">?</div>
              <span className="text-sm font-medium text-on-surface">Connect Wallet</span>
            </div>
          )}
        </div>
      </footer>
    </aside>
  );
}
