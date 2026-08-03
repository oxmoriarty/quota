'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useModal } from 'connectkit';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Activity, Wallet } from 'lucide-react';

export default function Home() {
  const { isConnected } = useAccount();
  const { setOpen } = useModal();
  const router = useRouter();

  const handleMainAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConnected) {
      router.push('/dashboard');
    } else {
      setOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface animate-slide-up pb-24">
      <main className="max-w-[900px] mx-auto mt-24 text-center px-6">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-outline-variant bg-surface-container-low text-xs font-medium text-on-surface mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Powered by GenLayer AI Consensus
        </div>

        <h1 className="text-[clamp(3rem,5vw,4.5rem)] font-headline font-black leading-[1.1] tracking-tight mb-6 text-primary">
          Distribute hackathon prizes <br />
          <span className="text-on-surface-variant">without the arguments.</span>
        </h1>
        
        <p className="text-lg text-on-surface-variant max-w-[600px] mx-auto mb-12 leading-relaxed">
          Quota is an AI-driven allocation engine. We replace subjective debates with transparent, evidence-based evaluations.
        </p>

        <div className="flex items-center justify-center gap-4 mb-24">
          <button 
            onClick={handleMainAction} 
            className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3.5 rounded text-base font-bold hover:opacity-90 transition-all shadow-xl active:scale-[0.98]"
          >
            {isConnected ? 'Go to Dashboard' : 'Connect Wallet'}
            <ArrowRight size={18} />
          </button>
          <Link 
            href="/how-it-works" 
            className="flex items-center gap-2 bg-surface-container-high border border-outline-variant text-on-surface px-8 py-3.5 rounded text-base font-bold hover:bg-surface-variant transition-all active:scale-[0.98]"
          >
            Read the Docs
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="bg-surface-container-low border border-outline-variant p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center mb-6">
              <Shield size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold font-headline mb-3 text-primary">Evidence-based</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Members submit commits, designs, and docs to a shared vault. GenLayer AI evaluates all contributions impartially based on impact.
            </p>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center mb-6">
              <Activity size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold font-headline mb-3 text-primary">Transparent</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              The AI proposes detailed reasoning and allocation arrays. Members review, appeal, and finalize consensus natively on-chain.
            </p>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center mb-6">
              <Wallet size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold font-headline mb-3 text-primary">Automatic Payouts</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Prizes are securely locked in a multi-chain Vault and distributed automatically to wallets once consensus is definitively reached.
            </p>
          </div>
          
        </div>
      </main>
    </div>
  );
}
