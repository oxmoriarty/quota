'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Sidebar } from '@/components/Sidebar';
import { Shield, Coins, FileCheck, CheckCircle2, Bot } from 'lucide-react';
import Image from 'next/image';

// Safely import gsap (Next.js client-side compatibility)
const gsapInstance = typeof window !== 'undefined' ? require('gsap').default : null;

export default function HowItWorksPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!gsapInstance || !containerRef.current) return;
    
    const ctx = gsapInstance.context(() => {
      // Header Animation
      gsapInstance.from('.animate-header', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        delay: 0.1
      });

      // Cards Animation
      gsapInstance.from('.step-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.4
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      icon: <Shield size={24} className="text-primary" />,
      title: "1. Deploy a Vault",
      desc: "When a team registers on Quota, the creator deploys an EVM-compatible Vault on the Base network. This smart contract is designed to hold the prize pool securely. Because we use an EIP-1167 Clone Factory, deploying a vault costs almost no gas."
    },
    {
      icon: <FileCheck size={24} className="text-tertiary" />,
      title: "2. Submit Evidence",
      desc: "As the hackathon progresses, team members submit evidence of their work directly to the project dashboard. This can include GitHub PR links, Figma design files, research documents, or summaries of leadership tasks. Everything is visible to all members."
    },
    {
      icon: <Bot size={24} className="text-error" />,
      title: "3. GenLayer AI Evaluation",
      desc: "Once the project ends, the vault is locked. Our backend Relayer submits all gathered evidence to the GenLayer Intelligent Contract. Using GenVM's native LLM capabilities and the Equivalence Principle (Comparative Validators), the AI impartially evaluates the exact proportional value of everyone's contribution."
    },
    {
      icon: <Coins size={24} className="text-green-400" />,
      title: "4. Review & Automatic Payout",
      desc: "The AI's reasoning and percentage allocation are displayed on the dashboard. If the team agrees, the backend Relayer signs the payload. Anyone can trigger the EVM Vault with this signature to automatically disburse the funds directly to everyone's wallets."
    }
  ];

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-surface-active overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col relative h-screen overflow-y-auto custom-scrollbar" ref={containerRef}>
        
        {/* Background glow */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-tertiary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <section className="px-8 py-20 max-w-4xl mx-auto w-full flex flex-col items-center text-center">
          <div className="animate-header mb-8 inline-flex items-center justify-center p-6 rounded-3xl bg-surface-container-highest border border-outline-variant shadow-2xl">
            <Image src="/quotalogo.svg" alt="Quota" width={320} height={100} className="drop-shadow-lg object-contain w-auto h-28" priority />
          </div>
          <h1 className="animate-header text-5xl md:text-6xl font-black font-headline tracking-tighter text-on-surface mb-6">
            The Future of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Fair Distribution</span>
          </h1>
          <p className="animate-header text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-16">
            Quota leverages GenLayer's AI Consensus to guarantee that hackathon prize pools are distributed impartially, based solely on cryptographically verified contributions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
            {steps.map((step, idx) => (
              <div key={idx} className="step-card group relative p-8 rounded-2xl bg-surface-container-low border border-outline-variant hover:bg-surface-container-high transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold font-headline text-on-surface mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 animate-header">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <CheckCircle2 size={14} /> Production Ready on Base Sepolia
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
