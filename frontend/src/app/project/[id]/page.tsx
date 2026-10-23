'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useSwitchChain, useWriteContract, usePublicClient } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { closeSubmissionsOnGenLayer, startAIEvaluationOnGenLayer, appealOnGenLayer, getProjectFromGenLayer, getGenLayerTransactionStatus } from '@/lib/genlayer';
import { vaultAbi } from '@/lib/abis';
import { Shield, Clock, Users, Zap, FileText, CheckCircle2, ChevronRight, AlertTriangle, ArrowRight, ExternalLink, Activity, Search, Bell, Terminal, Palette, Merge, Plus, Filter, Copy, Trash2, Menu, Coins, RotateCcw } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { useUI } from '@/components/UIProvider';

const GENLAYER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "GLMockContract123";

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const router = useRouter();
  const { toast, confirm } = useUI();

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [distributing, setDistributing] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'evaluation' | 'team'>('evidence');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Submission Form State
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Text');
  const [link, setLink] = useState('');
  
  // Join Form State
  const [joinRole, setJoinRole] = useState('Developer');

  useEffect(() => {
    fetchData();
  }, [id, address]);

  // Persistent Polling for Evaluating state
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if ((project?.status === 'Evaluating' || project?.status === 'Appeal in Progress') && GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
      const checkGenLayer = async () => {
        try {
          // Check transaction status on-chain if gl_tx_hash is present
          if (project.gl_tx_hash) {
            const receipt = await getGenLayerTransactionStatus(project.gl_tx_hash);
            if (receipt && (receipt.status === '0x0' || receipt.status === 0 || receipt.status === 'reverted' || receipt.status === 'FAILED')) {
              toast("GenLayer evaluation transaction reverted or failed on-chain.", "error");
              await supabase.from('projects').update({ status: 'Evaluation Failed' }).eq('id', project.id);
              fetchData();
              return;
            }
          }

          const glProject = await getProjectFromGenLayer(GENLAYER_CONTRACT_ADDRESS, project.id);
          
          if (project?.status === 'Evaluating' && glProject.status === "Allocation Finalized") {
            if (Array.isArray(glProject.allocations) && glProject.allocations.length > 0) {
              toast("AI Consensus Reached! Applying verified allocations.", "success");
              await supabase.from('projects').update({ status: 'Allocation Finalized' }).eq('id', project.id);
              await supabase.from('evaluations').insert({
                project_id: project.id,
                allocations: glProject.allocations,
                reasoning: "AI Evaluation finalized via GenLayer Consensus based on verified source contributions.",
                status: 'Finalized'
              });
              fetchData();
            }
          } else if (project?.status === 'Appeal in Progress' && glProject.status === "Appeal Resolved") {
            if (Array.isArray(glProject.allocations) && glProject.allocations.length > 0) {
              toast("Appeal Evaluation Complete! Updating allocations.", "success");
              await supabase.from('projects').update({ status: 'Appeal Resolved' }).eq('id', project.id);
              await supabase.from('evaluations').update({
                allocations: glProject.allocations,
                reasoning: "AI Appeal finalized via GenLayer Consensus after re-verifying contribution sources."
              }).eq('project_id', project.id);
              fetchData();
            }
          }
        } catch (err: any) {
          console.error("Error checking GenLayer status", err);
        }
      };
      
      checkGenLayer();
      intervalId = setInterval(checkGenLayer, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [project?.status, project?.id, project?.gl_tx_hash]);

  async function fetchData() {
    if (!id || !address) return;
    setLoading(true);
    try {
      const { data: user } = await supabase.from('users').select('*').eq('wallet_address', address.toLowerCase()).single();
      setCurrentUser(user);

      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single();
      setProject(proj);

      const { data: mems } = await supabase.from('team_members').select('*, users(username, wallet_address)').eq('project_id', id);
      setMembers(mems || []);

      const { data: subs } = await supabase.from('submissions').select('*, users(username)').eq('project_id', id).order('created_at', { ascending: false });
      setSubmissions(subs || []);

      const { data: evals } = await supabase.from('evaluations').select('*').eq('project_id', id).order('created_at', { ascending: false });
      setEvaluations(evals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isMember = members.some(m => m.user_id === currentUser?.id);
  const isCreator = project?.creator_id === currentUser?.id;
  const submissionsOpen = project?.status === 'Submissions Open';

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !project) return;
    try {
      await supabase.from('team_members').insert({ project_id: project.id, user_id: currentUser.id, role: joinRole });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !project) return;
    const evidenceUrls = link ? [link] : [];
    try {
      await supabase.from('submissions').insert({ project_id: project.id, user_id: currentUser.id, category, description: desc, evidence_urls: evidenceUrls });
      setDesc(''); setLink(''); fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteEvidence = async (submissionId: string) => {
    confirm("Delete Contribution", "Are you sure you want to delete this contribution?", async () => {
      try {
        await supabase.from('submissions').delete().eq('id', submissionId);
        fetchData();
        toast("Contribution deleted.", "success");
      } catch (err) { toast("Failed to delete contribution", "error"); }
    });
  };

  const handleCloseSubmissions = async () => {
    if (!isCreator || !address) return;
    confirm("Close Submissions", "Are you sure? No new submissions will be accepted.", async () => {
      try {
        if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
           toast("Confirming on GenLayer...", "info");
           await closeSubmissionsOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id);
        }
        await supabase.from('projects').update({ status: 'Submissions Closed' }).eq('id', project.id);
        fetchData();
        toast("Submissions successfully closed.", "success");
      } catch (err: any) { toast("Failed to close submissions: " + err.message, "error"); }
    });
  };

  const handleEvaluate = async () => {
    if (!isCreator || !address) return;
    try {
      if (!GENLAYER_CONTRACT_ADDRESS || GENLAYER_CONTRACT_ADDRESS === 'GLMockContract123') {
        throw new Error("GenLayer Intelligent Contract is not configured. Please set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS in .env.local.");
      }

      const res = await fetch(`/api/projects/${project.id}/evidence`);
      const evidenceText = await res.text();
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(evidenceText));
      const expectedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const evidenceUrl = `${window.location.origin}/api/projects/${project.id}/evidence`;
      
      toast("Submitting evaluation to GenLayer...", "info");
      const txHash = await startAIEvaluationOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id, evidenceUrl, expectedHash);
      toast("Evaluation started on GenLayer! You can safely leave the page.", "info");
      
      // Update status to Evaluating and record transaction hash
      try {
        await supabase.from('projects').update({ status: 'Evaluating', gl_tx_hash: txHash }).eq('id', project.id);
      } catch {
        await supabase.from('projects').update({ status: 'Evaluating' }).eq('id', project.id);
      }
      fetchData();
    } catch (err: any) { 
      toast("Failed to start evaluation: " + err.message, "error"); 
    }
  };

  const handleAppeal = async () => {
    if (!isMember || !address) return;
    confirm("Start Appeal", "This will trigger GenLayer AI consensus to re-crawl all evidence links and re-evaluate allocations. Proceed with appeal?", async () => {
      try {
        if (!GENLAYER_CONTRACT_ADDRESS || GENLAYER_CONTRACT_ADDRESS === 'GLMockContract123') {
          throw new Error("GenLayer Intelligent Contract is not configured.");
        }

        const res = await fetch(`/api/projects/${project.id}/evidence`);
        const evidenceText = await res.text();
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(evidenceText));
        const expectedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const evidenceUrl = `${window.location.origin}/api/projects/${project.id}/evidence`;
        
        toast("Submitting Appeal to GenLayer...", "info");
        const txHash = await appealOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id, evidenceUrl, expectedHash);
        toast("Appeal started on GenLayer! You can safely leave the page.", "info");
        
        try {
          await supabase.from('projects').update({ status: 'Appeal in Progress', gl_tx_hash: txHash }).eq('id', project.id);
        } catch {
          await supabase.from('projects').update({ status: 'Appeal in Progress' }).eq('id', project.id);
        }
        fetchData();
      } catch (err: any) { 
        toast("Failed to start appeal: " + err.message, "error"); 
      }
    });
  };

  const handlePayout = async () => {
    if (!project?.vault_address) return toast("No EVM Vault address linked to this project", "error");
    if (!address) return toast("Please connect your wallet", "error");

    confirm("Distribute Prize Pool", "This will execute the on-chain payout from the EVM Vault based strictly on the finalized GenLayer allocation. Proceed?", async () => {
      setDistributing(true);
      try {
        toast("Fetching verified GenLayer allocation and oracle signature...", "info");
        const res = await fetch(`/api/projects/${project.id}/payout-signature`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to generate payout signature");
        }

        toast("Submitting distribution transaction to EVM Vault...", "info");
        const evmTxHash = await writeContractAsync({
          address: project.vault_address as `0x${string}`,
          abi: vaultAbi,
          functionName: 'distribute',
          args: [
            data.recipients,
            data.percentages.map((p: string) => BigInt(p)),
            data.signature as `0x${string}`
          ],
        });

        toast("Waiting for EVM transaction confirmation...", "info");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: evmTxHash });
        }

        toast("Prize Pool distributed successfully!", "success");
        try {
          await supabase.from('projects').update({ status: 'Paid Out', payout_tx_hash: evmTxHash }).eq('id', project.id);
        } catch {
          await supabase.from('projects').update({ status: 'Paid Out' }).eq('id', project.id);
        }
        fetchData();
      } catch (err: any) {
        console.error("Payout error:", err);
        toast("Payout failed: " + (err.shortMessage || err.message), "error");
      } finally {
        setDistributing(false);
      }
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Project link copied to clipboard! Share it with your team.", "success");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-on-surface">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center min-h-screen">
          <Activity className="animate-pulse text-on-surface-variant" size={24} />
        </main>
      </div>
    );
  }

  if (!project) return <div className="flex min-h-screen bg-background text-on-surface items-center justify-center">Project not found</div>;

  return (
    <div className="flex min-h-screen bg-background text-on-surface selection:bg-surface-active overflow-hidden w-full">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 w-full md:ml-64 flex flex-col relative h-screen">
        
        {/* TopAppBar */}
        <header className="bg-surface sticky top-0 w-full h-14 md:h-16 border-b border-outline-variant z-30 flex justify-between items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1.5 -ml-2 text-on-surface hover:bg-surface-variant rounded-md">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 md:gap-6">
              <span className="font-body text-sm font-semibold text-primary truncate max-w-[150px] sm:max-w-xs">{project.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative group hidden sm:block">
              <input className="bg-surface-container border border-outline-variant rounded px-3 py-1 text-xs w-32 md:w-48 focus:w-48 md:focus:w-64 transition-all focus:outline-none focus:border-primary text-on-surface hover:border-outline-variant/80" placeholder="Search evidence..." type="text"/>
              <Search className="absolute right-2 top-1.5 text-on-surface-variant" size={14} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyInviteLink} className="flex items-center gap-1.5 bg-surface-container border border-outline-variant px-2 md:px-3 py-1.5 rounded text-xs font-bold hover:bg-surface-variant hover:text-primary transition-all group">
                <Copy size={14} className="group-hover:scale-110 transition-transform" /> <span className="hidden sm:inline">Copy Link</span>
              </button>
              {isCreator && submissionsOpen && (
                <button onClick={handleCloseSubmissions} className="bg-error/10 text-error border border-error/20 px-4 py-1.5 rounded text-xs font-bold hover:bg-error/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Close Submissions
                </button>
              )}
              {isCreator && (project.status === 'Submissions Closed' || project.status === 'Evaluation Failed') && (
                <button onClick={handleEvaluate} className="bg-primary text-on-primary px-4 py-1.5 rounded text-xs font-bold hover:opacity-90 hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-1.5">
                  {project.status === 'Evaluation Failed' ? <><RotateCcw size={13} /> Retry Evaluation</> : 'Run AI Evaluation'}
                </button>
              )}
              {(project.status === 'Allocation Finalized' || project.status === 'Appeal Resolved') && (
                <button onClick={handlePayout} disabled={distributing} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-md">
                  <Coins size={14} /> {distributing ? 'Distributing...' : 'Distribute Prize'}
                </button>
              )}
              {project.status === 'Paid Out' && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Paid Out
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Inner Tabs Navigation */}
          <div className="mb-8 border-b border-outline-variant flex gap-8">
            <button onClick={() => setActiveTab('evidence')} className={`pb-4 text-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 ${activeTab === 'evidence' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <FileText size={18} /> Evidence Vault
            </button>
            <button onClick={() => setActiveTab('evaluation')} className={`pb-4 text-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 ${activeTab === 'evaluation' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Activity size={18} /> AI Evaluation
            </button>
            <button onClick={() => setActiveTab('team')} className={`pb-4 text-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 ${activeTab === 'team' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Users size={18} /> Team ({members.length})
            </button>
          </div>

          {activeTab === 'evidence' && (
            <>
              {/* Page Heading */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface mb-2 drop-shadow-sm">Evidence Vault</h1>
                  <p className="text-on-surface-variant text-sm max-w-xl">
                    Repository of all technical contributions submitted for verification by the team.
                  </p>
                </div>
                {!isMember && (
                  <form onSubmit={handleJoin} className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-lg p-1.5 shadow-sm">
                    <select 
                      value={joinRole} 
                      onChange={e => setJoinRole(e.target.value)} 
                      className="bg-transparent border-none text-xs font-bold text-on-surface outline-none px-2 cursor-pointer"
                    >
                      <option value="Developer">Developer</option>
                      <option value="Designer">Designer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Marketer">Marketer</option>
                      <option value="Contributor">Contributor</option>
                    </select>
                    <button type="submit" className="flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-md text-xs font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <Plus size={14} /> Join Project
                    </button>
                  </form>
                )}
              </div>

              {isMember && submissionsOpen && (
                <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg mb-8 hover:border-primary/30 transition-colors shadow-sm">
                  <h3 className="text-sm font-bold text-on-surface mb-4">Submit Evidence</h3>
                  <form onSubmit={handleSubmitEvidence} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <select value={category} onChange={e => setCategory(e.target.value)} className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:border-primary outline-none flex-1 hover:border-outline-variant/80 transition-colors cursor-pointer">
                        <option value="Pull Request">Pull Request</option>
                        <option value="GitHub Commit">GitHub Commit</option>
                        <option value="Figma Link">Figma Link</option>
                        <option value="Technical Doc">Technical Doc</option>
                      </select>
                      <input type="url" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:border-primary outline-none flex-1 hover:border-outline-variant/80 transition-colors" />
                    </div>
                    <textarea required placeholder="Describe your contribution and impact..." value={desc} onChange={e => setDesc(e.target.value)} className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:border-primary outline-none w-full min-h-[80px] hover:border-outline-variant/80 transition-colors resize-y" />
                    <div className="flex justify-end">
                      <button type="submit" className="bg-surface-container-high border border-outline-variant px-4 py-2 rounded text-xs font-bold hover:bg-surface-variant hover:text-primary active:scale-[0.98] transition-all text-on-surface shadow-sm hover:shadow-md">Append to Vault</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-x-auto shadow-sm">
                <table className="w-full min-w-[600px] text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Contributor</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Type</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Description</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Date</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-sm">
                          No evidence committed yet.
                        </td>
                      </tr>
                    ) : submissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-surface-variant flex items-center justify-center overflow-hidden text-xs font-bold text-on-surface shadow-sm">
                              {sub.users?.username.substring(0,2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{sub.users?.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded border border-outline-variant bg-surface-container-high text-[10px] font-bold text-primary flex items-center gap-1 w-fit uppercase shadow-sm">
                            {sub.category === 'Pull Request' ? <Merge size={12} /> : sub.category === 'Figma Link' ? <Palette size={12} /> : <Terminal size={12} />}
                            {sub.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-on-surface">{sub.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">{new Date(sub.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                            {sub.evidence_urls?.[0] && (
                              <a href={sub.evidence_urls[0]} target="_blank" rel="noreferrer" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-md transition-all">
                                <ExternalLink size={16} />
                              </a>
                            )}
                            {submissionsOpen && sub.user_id === currentUser?.id && (
                              <button onClick={() => handleDeleteEvidence(sub.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-md transition-all">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'evaluation' && (
            <div className="animate-slide-up">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2 drop-shadow-sm">AI Evaluation</h1>
                  <p className="text-on-surface-variant text-sm max-w-xl">
                    GenLayer Consensus output based on algorithmic analysis of the Evidence Vault.
                  </p>
                </div>
              </div>

              {project?.status === 'Evaluating' || project?.status === 'Appeal in Progress' ? (
                 <div className="p-12 text-center bg-surface-container-low border border-primary/30 rounded-lg shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                     <div className="h-full bg-primary animate-pulse w-1/3 rounded-full"></div>
                   </div>
                   <Activity className="mx-auto mb-6 text-primary animate-bounce" size={40} />
                   <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">
                     {project?.status === 'Appeal in Progress' ? 'Evaluating Appeal on GenLayer...' : 'Evaluating Contributions on GenLayer...'}
                   </h3>
                   <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                     The GenLayer Intelligent Contract is currently crawling the Evidence Vault and verifying all external links. 
                     <br/><br/>
                     <span className="font-bold text-primary">This Non-Deterministic process runs on decentralized AI validators.</span> 
                     <br/>You may safely leave this page and check back later. We will automatically sync the results once consensus is reached.
                   </p>
                 </div>
              ) : project?.status === 'Evaluation Failed' ? (
                 <div className="p-12 text-center bg-surface-container-low border border-error/30 rounded-lg shadow-lg">
                   <AlertTriangle className="mx-auto mb-4 text-error" size={40} />
                   <h3 className="text-xl font-black text-on-surface mb-2 tracking-tight">Evaluation Failed On-Chain</h3>
                   <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6 leading-relaxed">
                     The GenLayer AI validator consensus failed to reach a finalized outcome or reverted. Your submissions and vault remain completely intact.
                   </p>
                   {isCreator && (
                     <button onClick={handleEvaluate} className="bg-primary text-on-primary px-5 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all inline-flex items-center gap-2">
                       <RotateCcw size={14} /> Retry AI Evaluation
                     </button>
                   )}
                 </div>
              ) : evaluations.length === 0 ? (
                 <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm">
                   <Activity className="mx-auto mb-4 text-on-surface-variant opacity-50" size={32} />
                   <h3 className="text-lg font-bold text-on-surface mb-2">Awaiting Consensus</h3>
                   <p className="text-sm text-on-surface-variant">The AI evaluation protocol has not been executed for this project yet.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg shadow-sm hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-2 mb-4 text-primary">
                        <Activity size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Execution Log & Reasoning</h3>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {evaluations[0].reasoning}
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-surface-container border border-outline-variant p-6 rounded-lg shadow-sm hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-primary" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Prize Allocations</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMember && project?.status === 'Allocation Finalized' && (
                            <button onClick={handleAppeal} className="bg-surface-variant hover:bg-error/10 hover:text-error text-on-surface-variant text-xs font-bold px-3 py-1.5 rounded transition-all">
                              Appeal Evaluation
                            </button>
                          )}
                          {(project?.status === 'Allocation Finalized' || project?.status === 'Appeal Resolved') && (
                            <button onClick={handlePayout} disabled={distributing} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-emerald-500 transition-all flex items-center gap-1 shadow-sm">
                              <Coins size={12} /> {distributing ? 'Distributing...' : 'Payout'}
                            </button>
                          )}
                          {project?.status === 'Appeal Resolved' && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Appeal Resolved</span>
                          )}
                          {project?.status === 'Paid Out' && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Paid Out</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {evaluations[0].allocations.map((alloc: any, i: number) => {
                          const member = members.find(m => m.users?.wallet_address === alloc.wallet);
                          return (
                            <div key={i}>
                              <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-bold text-on-surface">{member ? member.users.username : alloc.wallet.substring(0,8)+'...'}</span>
                                <span className="text-sm font-mono font-bold text-primary">{(alloc.percentage / 100).toFixed(2)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${alloc.percentage / 100}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="animate-slide-up">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2 drop-shadow-sm">Team Roster</h1>
                  <p className="text-on-surface-variant text-sm max-w-xl">
                    Members currently collaborating on this project.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                  <div key={member.id} className="bg-surface-container-low border border-outline-variant p-6 rounded-xl flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all hover:border-primary/30 group">
                    <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-lg font-black text-on-surface shadow-inner group-hover:scale-105 transition-transform">
                      {member.users?.username?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{member.users?.username}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 font-mono">{member.users?.wallet_address?.substring(0, 6)}...{member.users?.wallet_address?.substring(38)}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded border border-outline-variant bg-surface-container-high text-[10px] font-bold text-primary uppercase shadow-sm">
                        {member.role || 'Contributor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
