'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { QUOTA_VAULT_FACTORY_ABI } from '@/lib/abi';
import { createProjectOnGenLayer } from '@/lib/genlayer';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';
const GENLAYER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || 'GLMockContract123';

export default function CreateProjectPage() {
  const router = useRouter();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    hackathon: '',
    description: '',
    repo_url: '',
    prize_chain: 'Base',
    prize_token: 'USDC',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setLoading(true);
    setError('');

    try {
      // 1. Get user id from Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address.toLowerCase())
        .single();
        
      if (userError || !user) throw new Error("User not found in database. Please register.");

      // 2. Trigger EVM Vault Deployment via Factory
      let vaultAddress = null;
      try {
        console.log("Triggering EVM Vault Deployment...");
        // This will fail gas estimation if FACTORY_ADDRESS is 0x0... 
        // In a real app with a deployed factory, this pops up the wallet.
        if (FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000') {
          if (chainId !== 84532) {
            console.log("Switching to Base Sepolia...");
            await switchChainAsync({ chainId: 84532 });
          }

          // Simulate the transaction first to get the returned Vault Address
          const { request, result } = await publicClient!.simulateContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: QUOTA_VAULT_FACTORY_ABI,
            functionName: 'createVault',
            account: address as `0x${string}`,
          });
          
          vaultAddress = result; // The returned address from the contract
          console.log("Vault will be deployed to:", vaultAddress);
          
          const hash = await writeContractAsync(request);
          console.log("Vault Deployment Hash:", hash);
        } else {
          console.log("Skipping EVM deployment (No Factory Address set).");
          vaultAddress = `0xMockVault_${Date.now()}`;
        }
      } catch (err: any) {
        console.warn("Vault deployment failed or rejected, falling back to mock:", err.message);
        vaultAddress = `0xMockVault_${Date.now()}`;
      }

      // 3. Save to Supabase
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          hackathon: formData.hackathon,
          description: formData.description,
          repo_url: formData.repo_url,
          prize_chain: formData.prize_chain,
          prize_token: formData.prize_token,
          vault_address: vaultAddress,
          creator_id: user.id,
          status: 'Submissions Open'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add creator as a team member automatically
      await supabase
        .from('team_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'Creator'
        });

      // 4. Register Project on GenLayer Registry
      try {
        console.log("Registering project on GenLayer...");
        if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
           if (chainId !== 4221) {
             console.log("Switching to GenLayer Bradbury...");
             await switchChainAsync({ chainId: 4221 });
           }
           await createProjectOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id);
        } else {
           console.log("Skipping GenLayer Registration (No Registry Address set).");
        }
      } catch (err: any) {
        console.warn("GenLayer registration failed:", err.message);
      }

      router.push(`/project/${project.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Create Hackathon Project</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Project Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hackathon Name *</label>
            <input required type="text" name="hackathon" value={formData.hackathon} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Short Description *</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Repository URL *</label>
          <input required type="url" name="repo_url" value={formData.repo_url} onChange={handleChange} style={inputStyle} placeholder="https://github.com/..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Prize Chain *</label>
            <select name="prize_chain" value={formData.prize_chain} onChange={handleChange} style={inputStyle}>
              <option value="Base">Base</option>
              <option value="Monad">Monad</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Optimism">Optimism</option>
              <option value="Arbitrum">Arbitrum</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Expected Prize Token *</label>
            <input required type="text" name="prize_token" value={formData.prize_token} onChange={handleChange} style={inputStyle} placeholder="USDC, ETH, etc." />
          </div>
        </div>
        
        {error && <div style={{ color: 'var(--destructive)', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => router.back()} style={{
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            border: '1px solid var(--border)',
          }}>Cancel</button>
          <button type="submit" disabled={loading} style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            border: 'none',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--input)',
  color: 'var(--foreground)',
  fontSize: '1rem'
};
