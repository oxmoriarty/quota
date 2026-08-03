'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useSwitchChain } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { closeSubmissionsOnGenLayer, startAIEvaluationOnGenLayer, appealOnGenLayer, getProjectFromGenLayer } from '@/lib/genlayer';
import { Shield, Clock, Users, Zap, FileText, CheckCircle2, ChevronRight, AlertTriangle, ArrowRight, ExternalLink, Activity, Search, Bell, Terminal, Palette, Merge, Plus, Filter } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

const GENLAYER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "GLMockContract123";

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'evaluation'>('evidence');
  
  // Submission Form State
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Text');
  const [link, setLink] = useState('');

  useEffect(() => {
    fetchData();
  }, [id, address]);

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

  const handleJoin = async () => {
    if (!currentUser || !project) return;
    try {
      await supabase.from('team_members').insert({ project_id: project.id, user_id: currentUser.id, role: 'Contributor' });
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

  const handleCloseSubmissions = async () => {
    if (!isCreator || !address) return;
    if (confirm("Are you sure? No new submissions will be accepted.")) {
      try {
        if (chainId !== 4221) await switchChainAsync({ chainId: 4221 });
        if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
           await closeSubmissionsOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id);
        }
        await supabase.from('projects').update({ status: 'Submissions Closed' }).eq('id', project.id);
        fetchData();
      } catch (err: any) { alert("Failed to close submissions: " + err.message); }
    }
  };

  const handleEvaluate = async () => {
    if (!isCreator || !address) return;
    try {
      // 1. Fetch the exact JSON evidence the GenVM will see
      const res = await fetch(`/api/projects/${project.id}/evidence`);
      const evidenceText = await res.text();
      
      // 2. Hash it to guarantee integrity on-chain
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(evidenceText));
      const expectedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // In production, this would be your deployed domain instead of localhost
      const evidenceUrl = `${window.location.origin}/api/projects/${project.id}/evidence`;
      
      if (chainId !== 4221) await switchChainAsync({ chainId: 4221 });
      
      if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
         await startAIEvaluationOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id, evidenceUrl, expectedHash);
         alert("Transaction submitted! Waiting for GenLayer AI Consensus to finalize... (This may take a few seconds)");
         let attempts = 0;
         const pollInterval = setInterval(async () => {
           try {
             attempts++;
             const glProject = await getProjectFromGenLayer(GENLAYER_CONTRACT_ADDRESS, project.id);
             if (glProject.status === "Allocation Finalized") {
               clearInterval(pollInterval);
               alert("AI Consensus Reached! Applying allocations.");
               await supabase.from('projects').update({ status: 'Allocation Finalized' }).eq('id', project.id);
               await supabase.from('evaluations').insert({ project_id: project.id, allocations: glProject.allocations, reasoning: "AI Evaluation finalized via GenLayer Consensus.", status: 'Finalized' });
               fetchData();
             } else if (attempts > 20) {
               clearInterval(pollInterval);
               console.warn("Polling timed out.");
             }
           } catch (err) {}
         }, 5000);
      } else {
         await supabase.from('projects').update({ status: 'Allocation Finalized' }).eq('id', project.id);
         fetchData();
      }
    } catch (err: any) { alert("Failed to start evaluation: " + err.message); }
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
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col relative h-screen">
        
        {/* TopAppBar */}
        <header className="bg-surface sticky top-0 w-full h-14 border-b border-outline-variant z-40 flex justify-between items-center px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <span className="font-body text-sm font-semibold text-primary">{project.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input className="bg-surface-container border border-outline-variant rounded px-3 py-1 text-xs w-48 focus:w-64 transition-all focus:outline-none focus:border-primary text-on-surface" placeholder="Search evidence..." type="text"/>
              <Search className="absolute right-2 top-1.5 text-on-surface-variant" size={14} />
            </div>
            <div className="flex items-center gap-2">
              {isCreator && submissionsOpen && (
                <button onClick={handleCloseSubmissions} className="bg-error/10 text-error border border-error/20 px-4 py-1.5 rounded text-xs font-bold hover:bg-error/20 transition-all">
                  Close Submissions
                </button>
              )}
              {isCreator && project.status === 'Submissions Closed' && (
                <button onClick={handleEvaluate} className="bg-primary text-on-primary px-4 py-1.5 rounded text-xs font-bold hover:opacity-90 active:scale-95 transition-all">
                  Run AI Evaluation
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Inner Tabs Navigation */}
          <div className="mb-8 border-b border-outline-variant flex gap-8">
            <button onClick={() => setActiveTab('evidence')} className={`pb-4 text-sm transition-all flex items-center gap-2 ${activeTab === 'evidence' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <FileText size={18} /> Evidence Vault
            </button>
            <button onClick={() => setActiveTab('evaluation')} className={`pb-4 text-sm transition-all flex items-center gap-2 ${activeTab === 'evaluation' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Activity size={18} /> AI Evaluation
            </button>
          </div>

          {activeTab === 'evidence' && (
            <>
              {/* Page Heading */}
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white mb-2">Evidence Vault</h1>
                  <p className="text-on-surface-variant text-sm max-w-xl">
                    Repository of all technical contributions submitted for verification by the team.
                  </p>
                </div>
                {!isMember && (
                  <button onClick={handleJoin} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded text-xs font-bold hover:opacity-90 transition-all">
                    <Plus size={14} /> Join Team
                  </button>
                )}
              </div>

              {isMember && submissionsOpen && (
                <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg mb-8">
                  <h3 className="text-sm font-bold text-on-surface mb-4">Submit Evidence</h3>
                  <form onSubmit={handleSubmitEvidence} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <select value={category} onChange={e => setCategory(e.target.value)} className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:border-primary outline-none flex-1">
                        <option value="Pull Request">Pull Request</option>
                        <option value="GitHub Commit">GitHub Commit</option>
                        <option value="Figma Link">Figma Link</option>
                        <option value="Technical Doc">Technical Doc</option>
                      </select>
                      <input type="url" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:border-primary outline-none flex-1" />
                    </div>
                    <textarea required placeholder="Describe your contribution and impact..." value={desc} onChange={e => setDesc(e.target.value)} className="bg-surface-container-highest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:border-primary outline-none w-full min-h-[80px]" />
                    <div className="flex justify-end">
                      <button type="submit" className="bg-surface-container-high border border-outline-variant px-4 py-2 rounded text-xs font-bold hover:bg-surface-variant transition-colors text-on-surface">Append to Vault</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
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
                            <div className="w-7 h-7 rounded bg-surface-variant flex items-center justify-center overflow-hidden text-xs font-bold text-on-surface">
                              {sub.users?.username.substring(0,2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-on-surface">{sub.users?.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded border border-outline-variant bg-surface-container-high text-[10px] font-bold text-primary flex items-center gap-1 w-fit uppercase">
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
                          {sub.evidence_urls?.[0] && (
                            <a href={sub.evidence_urls[0]} target="_blank" rel="noreferrer" className="p-1 text-on-surface-variant hover:text-primary transition-colors inline-block">
                              <ExternalLink size={16} />
                            </a>
                          )}
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
                  <h1 className="text-3xl font-black tracking-tight text-white mb-2">AI Evaluation</h1>
                  <p className="text-on-surface-variant text-sm max-w-xl">
                    GenLayer Consensus output based on algorithmic analysis of the Evidence Vault.
                  </p>
                </div>
              </div>

              {evaluations.length === 0 ? (
                 <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant rounded-lg">
                   <Activity className="mx-auto mb-4 text-on-surface-variant opacity-50" size={32} />
                   <h3 className="text-lg font-bold text-on-surface mb-2">Awaiting Consensus</h3>
                   <p className="text-sm text-on-surface-variant">The AI evaluation protocol has not been executed for this project yet.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8 space-y-6">
                    <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-4 text-primary">
                        <Activity size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Execution Log & Reasoning</h3>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {evaluations[0].reasoning}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-6">
                    <div className="bg-surface-container border border-outline-variant p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-6">
                        <Shield size={16} className="text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Prize Allocations</h3>
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

        </div>
      </main>
    </div>
  );
}
