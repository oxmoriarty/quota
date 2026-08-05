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
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant flex flex-col z-20">
      {/* Brand / Header */}
      <div className="h-16 w-full flex items-center justify-center border-b border-transparent relative">
        <Link href="/" className="flex items-center group absolute -bottom-2 translate-y-0">
          <div className="hidden dark:block">
            <Image src="/quotalogo.svg" alt="Quota Logo" width={220} height={70} className="drop-shadow-lg object-contain w-auto h-[70px]" priority />
          </div>
          <div className="block dark:hidden">
            <Image src="/quotalogoblack.svg" alt="Quota Logo" width={220} height={70} className="drop-shadow-lg object-contain w-auto h-[70px]" priority />
          </div>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-2 mt-4 px-4">
        <div className="px-2 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider opacity-50">Workspace</div>
        
        <Link href="/dashboard" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-150 cursor-pointer active:scale-[0.98] ${isActive('/dashboard') ? 'text-primary font-bold bg-secondary-container/30 border border-primary/20' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright border border-transparent'}`}>
          <Rocket size={20} />
          <span className="font-body text-label-medium antialiased">Active Projects</span>
        </Link>
        
        <Link href="/create" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-150 cursor-pointer active:scale-[0.98] ${isActive('/create') ? 'text-primary font-bold bg-secondary-container/30 border border-primary/20' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright border border-transparent'}`}>
          <Plus size={20} />
          <span className="font-body text-label-medium antialiased">New Project</span>
        </Link>
        
        <Link href="/settings" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-150 cursor-pointer active:scale-[0.98] ${isActive('/settings') ? 'text-primary font-bold bg-secondary-container/30 border border-primary/20' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright border border-transparent'}`}>
          <Settings size={20} />
          <span className="font-body text-label-medium antialiased">Settings</span>
        </Link>
      </nav>

      {/* Footer Tabs */}
      <footer className="pt-4 pb-4 px-4 border-t border-outline-variant space-y-1">
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
