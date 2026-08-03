'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSwitchChain, useWriteContract, usePublicClient } from 'wagmi';
import { parseEventLogs } from 'viem';
import { supabase } from '@/lib/supabase';
import { Shield, Sparkles, Building2, ArrowRight, LayoutDashboard, Search, Bell, User } from 'lucide-react';
import { createProjectOnGenLayer } from '@/lib/genlayer';
import { vaultFactoryAbi } from '@/lib/abis';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';

const GENLAYER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "GLMockContract123";
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

export default function CreateProject() {
  const router = useRouter();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hackathon: '',
    prizeToken: 'USDC',
    prizeChain: 'Base',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Please connect wallet");
    if (!publicClient) return alert("Wagmi client not ready");
    if (!FACTORY_ADDRESS) return alert("Missing Factory Address in env");
    
    setLoading(true);
    try {
      const { data: user } = await supabase.from('users').select('*').eq('wallet_address', address.toLowerCase()).single();
      if (!user) throw new Error("User not found");

      // 1. Deploy EVM Vault
      console.log("Deploying EVM Vault...");
      const TOKENS: Record<string, string> = {
        'ETH': '0x0000000000000000000000000000000000000000',
        'USDC': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia Mock
        'USDT': '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'  // Base Sepolia Mock
      };
      const tokenAddress = TOKENS[formData.prizeToken] || TOKENS['USDC'];

      const evmTxHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: vaultFactoryAbi,
        functionName: 'createVault',
        args: [tokenAddress as `0x${string}`],
      });
      
      console.log(`Waiting for EVM tx: ${evmTxHash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: evmTxHash });
      const logs = parseEventLogs({ abi: vaultFactoryAbi, logs: receipt.logs, eventName: 'VaultCreated' });
      
      if (!logs || logs.length === 0) throw new Error("Failed to parse VaultCreated event");
      const vaultAddress = logs[0].args.vault;
      console.log(`EVM Vault Created at: ${vaultAddress}`);

      // 2. Save to Supabase
      const { data, error } = await supabase.from('projects').insert({
        name: formData.name,
        hackathon: formData.hackathon,
        prize_token: formData.prizeToken,
        prize_chain: formData.prizeChain,
        vault_address: vaultAddress,
        description: formData.description,
        creator_id: user.id,
        status: 'Submissions Open'
      }).select().single();

      if (error) throw error;
      
      await supabase.from('team_members').insert({
        project_id: data.id,
        user_id: user.id,
        role: 'Creator / PM'
      });

      // 3. Register on GenLayer
      try {
        if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
           if (chainId !== 4221 && switchChainAsync) {
             console.log("Switching to GenLayer Bradbury...");
             await switchChainAsync({ chainId: 4221 });
           }
           await createProjectOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, data.id, vaultAddress);
        }
      } catch (err: any) {
        console.warn("GenLayer registration failed:", err.message);
      }
      
      router.push(`/project/${data.id}`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-surface-active">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen relative">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-10 bg-background border-b border-outline-variant">
          <div className="flex items-center space-x-4">
            <h1 className="font-headline text-2xl font-semibold text-primary tracking-tight">New Workspace</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-all focus:ring-2 focus:ring-primary/20">
                <Bell size={20} />
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-all focus:ring-2 focus:ring-primary/20">
                <User size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="p-8 flex-1 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar animate-slide-up">
          <div className="w-full max-w-2xl">
            
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-highest border border-outline-variant text-primary mb-4 shadow-inner">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-3xl font-black font-headline text-primary tracking-tight mb-2">Create a Workspace</h1>
              <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                Deploy a vault for your project.
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Project Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Quota Protocol" 
                      className="bg-surface-container-highest border border-outline-variant rounded px-10 py-2.5 text-sm w-full focus:outline-none focus:border-primary text-on-surface transition-colors"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Hackathon / Event</label>
                  <div className="relative">
                    <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. ETHGlobal London" 
                      className="bg-surface-container-highest border border-outline-variant rounded px-10 py-2.5 text-sm w-full focus:outline-none focus:border-primary text-on-surface transition-colors"
                      value={formData.hackathon} 
                      onChange={e => setFormData({...formData, hackathon: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-outline-variant my-2"></div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Project Details</label>
                  <textarea 
                    required 
                    placeholder="Describe your project, goals, and the scope of work for the hackathon..." 
                    className="bg-surface-container-highest border border-outline-variant rounded px-4 py-3 text-sm w-full focus:outline-none focus:border-primary text-on-surface transition-colors min-h-[100px]"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>

                <div className="h-px w-full bg-outline-variant my-2"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Prize Token</label>
                    <select 
                      className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2.5 text-sm w-full focus:outline-none focus:border-primary text-on-surface transition-colors"
                      value={formData.prizeToken} 
                      onChange={e => setFormData({...formData, prizeToken: e.target.value})}
                    >
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Network Chain</label>
                    <select 
                      className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2.5 text-sm w-full focus:outline-none focus:border-primary text-on-surface transition-colors"
                      value={formData.prizeChain} 
                      onChange={e => setFormData({...formData, prizeChain: e.target.value})}
                    >
                      <option value="Base">Base</option>
                      <option value="Optimism" disabled>Optimism (Coming Soon)</option>
                      <option value="Arbitrum" disabled>Arbitrum (Coming Soon)</option>
                      <option value="Ethereum" disabled>Ethereum (Coming Soon)</option>
                    </select>
                  </div>
                </div>



                <div className="mt-4">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-primary text-on-primary py-3 rounded text-sm font-bold hover:bg-opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                        Initializing Dual-Chain Workspace...
                      </span>
                    ) : (
                      <>Deploy Workspace <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </section>
      </main>
    </div>
  );
}
