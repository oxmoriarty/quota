'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useModal } from 'connectkit';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Activity, Wallet, ChevronRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function Home() {
  const { isConnected } = useAccount();
  const { setOpen } = useModal();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Background floating orbs animation
    gsap.to('.hero-orb', {
      y: 'random(-20, 20)',
      x: 'random(-20, 20)',
      duration: 'random(3, 5)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.2
    });

    // Staggered entry animation for hero content
    gsap.fromTo('.stagger-reveal', 
      { y: 40, opacity: 0, filter: 'blur(10px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
    );

    // Feature cards slide up
    gsap.fromTo('.feature-card',
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.2)', delay: 0.6 }
    );
  }, { scope: containerRef });

  const handleMainAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConnected) {
      router.push('/dashboard');
    } else {
      setOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-on-surface overflow-hidden relative selection:bg-primary/20">
      
      {/* Abstract Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="hero-orb absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-50 dark:opacity-20" />
        <div className="hero-orb absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-tertiary/20 blur-[100px] mix-blend-screen opacity-50 dark:opacity-20" />
        <div className="hero-orb absolute top-[40%] left-[60%] w-[20vw] h-[20vw] rounded-full bg-secondary/15 blur-[80px] mix-blend-screen opacity-50 dark:opacity-20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 dark:opacity-10" />
      </div>

      <main className="relative z-10 max-w-[1100px] mx-auto mt-32 text-center px-6 pb-32">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center">

          <h1 className="stagger-reveal text-[clamp(2.5rem,6vw,5.5rem)] font-headline font-black leading-[1.05] tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-on-surface via-on-surface to-on-surface-variant drop-shadow-sm max-w-[900px]">
            Distribute hackathon prizes <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-tertiary opacity-90">without the arguments.</span>
          </h1>
          
          <p className="stagger-reveal text-lg md:text-xl text-on-surface-variant max-w-[650px] mx-auto mb-12 leading-relaxed font-medium">
            Quota replaces subjective debates with transparent, evidence-based evaluations. Let AI analyze the commits, so you can focus on building.
          </p>

          <div className="stagger-reveal flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={handleMainAction} 
              className="group relative w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl text-base font-bold shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-15px_rgba(var(--primary),0.7)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                {isConnected ? 'Enter Dashboard' : 'Connect Wallet'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-surface/50 backdrop-blur-md border border-outline-variant/50 text-on-surface px-8 py-4 rounded-xl text-base font-bold hover:bg-surface-container-low transition-all duration-300 active:scale-[0.98]"
            >
              Read the Docs
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100" />
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-32">
          
          <div className="feature-card group relative bg-surface-container-lowest/40 backdrop-blur-xl border border-outline-variant/50 p-8 rounded-3xl hover:bg-surface-container-low/60 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-outline-variant/50 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Shield size={28} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-4 text-on-surface group-hover:text-primary transition-colors">Evidence-based</h3>
              <p className="text-on-surface-variant text-base leading-relaxed">
                Members submit commits, designs, and docs to a shared vault. GenLayer AI evaluates all contributions impartially based on real impact.
              </p>
            </div>
          </div>
          
          <div className="feature-card group relative bg-surface-container-lowest/40 backdrop-blur-xl border border-outline-variant/50 p-8 rounded-3xl hover:bg-surface-container-low/60 hover:border-tertiary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-tertiary/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-outline-variant/50 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Activity size={28} className="text-tertiary" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-4 text-on-surface group-hover:text-tertiary transition-colors">Transparent</h3>
              <p className="text-on-surface-variant text-base leading-relaxed">
                The AI proposes detailed reasoning and allocation arrays. Members review, appeal, and finalize consensus natively on-chain.
              </p>
            </div>
          </div>
          
          <div className="feature-card group relative bg-surface-container-lowest/40 backdrop-blur-xl border border-outline-variant/50 p-8 rounded-3xl hover:bg-surface-container-low/60 hover:border-secondary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-secondary/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-outline-variant/50 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Wallet size={28} className="text-secondary" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-4 text-on-surface group-hover:text-secondary transition-colors">Automatic Payouts</h3>
              <p className="text-on-surface-variant text-base leading-relaxed">
                Prizes are securely locked in a multi-chain Vault and distributed automatically to wallets once consensus is definitively reached.
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
