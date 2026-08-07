'use client';

import Link from 'next/link';
import { ConnectKitButton } from 'connectkit';
import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();

  if (pathname !== '/') return null;

  return (
    <header className="sticky top-0 w-full z-50 flex items-center justify-center backdrop-blur-md bg-background/80 border-b border-outline-variant h-12 sm:h-16">
      <div className="flex justify-between items-center w-full max-w-[1200px] px-4 sm:px-6 h-full relative">
        <div className="flex items-center h-full">
          <Link href="/" className="flex items-center group absolute -bottom-1.5 sm:-bottom-2 translate-y-0">
            <div className="hidden dark:block">
              <Image src="/quotalogo.svg" alt="Quota Logo" width={240} height={76} className="transition-transform group-hover:scale-105 drop-shadow-md object-contain w-[110px] h-auto sm:w-auto sm:h-[76px]" priority />
            </div>
            <div className="block dark:hidden">
              <Image src="/quotalogoblack.svg" alt="Quota Logo" width={240} height={76} className="transition-transform group-hover:scale-105 drop-shadow-md object-contain w-[110px] h-auto sm:w-auto sm:h-[76px]" priority />
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress, ensName }) => {
              return (
                <button 
                  onClick={show} 
                  className={isConnected 
                    ? "bg-surface-container-high text-on-surface px-2.5 py-1 sm:px-4 sm:py-2 rounded text-[11px] sm:text-sm font-semibold hover:bg-surface-variant transition-colors border border-outline-variant shadow hover:shadow-md" 
                    : "bg-primary text-on-primary px-2.5 py-1 sm:px-4 sm:py-2 rounded text-[11px] sm:text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm hover:shadow-primary/30"}
                >
                  {isConnected ? (ensName ?? truncatedAddress) : "Connect Wallet"}
                </button>
              );
            }}
          </ConnectKitButton.Custom>
        </div>
      </div>
    </header>
  );
}
