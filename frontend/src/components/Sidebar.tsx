'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Clock, Settings, FileText, HelpCircle, Plus } from 'lucide-react';
import { useAccount } from 'wagmi';

export function Sidebar() {
  const pathname = usePathname();
  const { address } = useAccount();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant flex flex-col p-4 space-y-6 z-20">
      {/* Brand / Header */}
      <Link href="/" className="flex items-center space-x-3 px-2">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Rocket size={18} className="text-on-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-headline font-bold text-on-surface tracking-tight">Quota OS</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">Hackathon Engine</span>
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
        
        <div className="flex items-center space-x-3 p-2 mt-4 overflow-hidden">
          <div className="w-6 h-6 rounded-full border border-outline-variant bg-surface-bright flex items-center justify-center text-[10px]">
             {address ? address.substring(2,4) : '?'}
          </div>
          <span className="text-sm font-medium text-on-surface truncate">
            {address ? `${address.substring(0,6)}...${address.substring(38)}` : 'Not Connected'}
          </span>
        </div>
      </footer>
    </aside>
  );
}
