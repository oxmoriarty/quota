'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useSwitchChain } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { closeSubmissionsOnGenLayer, startAIEvaluationOnGenLayer, appealOnGenLayer, getProjectFromGenLayer } from '@/lib/genlayer';

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
  
  // Submission Form State
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Text');
  const [link, setLink] = useState('');
  
  const [joinRole, setJoinRole] = useState('Frontend Developer');

  useEffect(() => {
    fetchData();
  }, [id, address]);

  async function fetchData() {
    if (!id || !address) return;
    setLoading(true);
    try {
      // 1. Current user
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();
      setCurrentUser(user);

      // 2. Project
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      setProject(proj);

      // 3. Members (join with users)
      const { data: mems } = await supabase
        .from('team_members')
        .select('*, users(username, wallet_address)')
        .eq('project_id', id);
      setMembers(mems || []);

      // 4. Submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, users(username)')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      setSubmissions(subs || []);

      // 5. Evaluations
      const { data: evals } = await supabase
        .from('evaluations')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
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
      await supabase.from('team_members').insert({
        project_id: project.id,
        user_id: currentUser.id,
        role: joinRole
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !project) return;
    
    const evidenceUrls = link ? [link] : [];
    
    try {
      await supabase.from('submissions').insert({
        project_id: project.id,
        user_id: currentUser.id,
        category,
        description: desc,
        evidence_urls: evidenceUrls
      });
      
      setDesc('');
      setLink('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseSubmissions = async () => {
    if (!isCreator || !address) return;
    if (confirm("Are you sure? No new submissions will be accepted.")) {
      try {
        if (chainId !== 4221) {
          await switchChainAsync({ chainId: 4221 });
        }
        
        if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
           await closeSubmissionsOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id);
        } else {
           console.log("Simulating GenLayer Transaction (No Registry Address set).");
        }
        await supabase.from('projects').update({ status: 'Submissions Closed' }).eq('id', project.id);
        fetchData();
      } catch (err: any) {
        alert("Failed to close submissions: " + err.message);
      }
    }
  };

  const handleEvaluate = async () => {
    if (!isCreator || !address) return;
    
    try {
      // Create a mock evidence URL (In reality, this would be an API endpoint returning the submissions JSON)
      const evidenceUrl = `http://localhost:3000/api/projects/${project.id}/evidence`;
      const expectedHash = "mock_hash_for_now"; 
      
      if (chainId !== 4221) {
        await switchChainAsync({ chainId: 4221 });
      }
      
      if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
         await startAIEvaluationOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id, evidenceUrl, expectedHash);
         
         // Start polling GenLayer for the result
         alert("Transaction submitted! Waiting for GenLayer AI Consensus to finalize... (This may take a few seconds)");
         
         let attempts = 0;
         const pollInterval = setInterval(async () => {
           try {
             attempts++;
             const glProject = await getProjectFromGenLayer(GENLAYER_CONTRACT_ADDRESS, project.id);
             
             if (glProject.status === "Allocation Finalized") {
               clearInterval(pollInterval);
               alert("AI Consensus Reached! Applying allocations.");
               
               // Read actual allocations from GenLayer and save to our DB
               await supabase.from('projects').update({ status: 'Allocation Finalized' }).eq('id', project.id);
               
               await supabase.from('evaluations').insert({
                 project_id: project.id,
                 allocations: glProject.allocations,
                 reasoning: "AI Evaluation finalized via GenLayer Consensus.",
                 status: 'Finalized'
               });
               
               fetchData();
             } else if (attempts > 20) {
               clearInterval(pollInterval);
               console.warn("Polling timed out.");
             }
           } catch (err) {
             console.error("Polling error:", err);
           }
         }, 5000); // Poll every 5 seconds
         
      } else {
         console.log("Simulating GenLayer Transaction (No Registry Address set).");
         await supabase.from('projects').update({ status: 'Allocation Finalized' }).eq('id', project.id);
      }
      
    } catch (err: any) {
      alert("Failed to start evaluation: " + err.message);
    }
  };

  const handleAppeal = async () => {
    if (!isCreator || !address) return;
    
    if (confirm("Are you sure you want to appeal this result? This will notify the GenLayer AI to review additional evidence.")) {
      try {
        if (chainId !== 4221) {
          await switchChainAsync({ chainId: 4221 });
        }
        
        if (GENLAYER_CONTRACT_ADDRESS && GENLAYER_CONTRACT_ADDRESS !== 'GLMockContract123') {
           await appealOnGenLayer(GENLAYER_CONTRACT_ADDRESS, address, project.id);
        }
        
        await supabase.from('projects').update({ status: 'Appeals Open' }).eq('id', project.id);
        fetchData();
      } catch (err: any) {
        alert("Failed to start appeal: " + err.message);
      }
    }
  };

  if (loading) return <div className="container main-content">Loading...</div>;
  if (!project) return <div className="container main-content">Project not found</div>;

  return (
    <div className="container main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{project.name}</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Hackathon: {project.hackathon}</p>
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ backgroundColor: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
              {project.status}
            </span>
            <span style={{ backgroundColor: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
              Chain: {project.prize_chain} ({project.prize_token})
            </span>
            <span style={{ backgroundColor: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
              Vault: {project.vault_address || '0xMockVault123456789...'}
            </span>
          </div>
        </div>
        
        {isCreator && submissionsOpen && (
          <button onClick={handleCloseSubmissions} style={{ ...btnStyle, backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
            Close Submissions
          </button>
        )}
        {isCreator && project.status === 'Submissions Closed' && (
          <button onClick={handleEvaluate} style={{ ...btnStyle, backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            Start AI Evaluation
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
        <div>
          {evaluations.length > 0 && (
            <section style={{ backgroundColor: 'var(--card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>AI Evaluation Results</h2>
                {project.status === 'Allocation Finalized' && isMember && (
                  <button onClick={handleAppeal} style={{ ...btnStyle, backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                    Appeal Decision
                  </button>
                )}
              </div>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                {evaluations[0].reasoning}
              </p>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Allocations:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {evaluations[0].allocations.map((alloc: any, i: number) => {
                  const member = members.find(m => m.users?.wallet_address === alloc.wallet);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                      <div>
                        <strong>{member ? member.users.username : alloc.wallet}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{alloc.wallet}</div>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        {(alloc.percentage / 100).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Submissions Section */}
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Contributions & Evidence</h2>
            
            {!isMember ? (
              <div style={{ backgroundColor: 'var(--card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem' }}>You are not a member of this project</h3>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <select value={joinRole} onChange={e => setJoinRole(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius)' }}>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Smart Contract Developer">Smart Contract Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Product Manager">Product Manager</option>
                  </select>
                  <button onClick={handleJoin} style={btnStyle}>Join Project</button>
                </div>
              </div>
            ) : (
              <>
                {submissionsOpen && (
                  <form onSubmit={handleSubmitEvidence} style={{ backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Submit Evidence</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                        <option value="Text">Text Summary</option>
                        <option value="GitHub">GitHub PR / Commit</option>
                        <option value="Design">Figma / Design Link</option>
                        <option value="Other Link">Other Link</option>
                      </select>
                      <textarea required placeholder="What did you do? Briefly describe your contribution." value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                      <input type="url" placeholder="Optional: Link to evidence (GitHub, Figma, Docs)" value={link} onChange={e => setLink(e.target.value)} style={inputStyle} />
                      <div style={{ textAlign: 'right' }}>
                        <button type="submit" style={btnStyle}>Submit Evidence</button>
                      </div>
                    </div>
                  </form>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {submissions.length === 0 ? (
                    <p style={{ color: 'var(--muted-foreground)' }}>No evidence submitted yet.</p>
                  ) : (
                    submissions.map(sub => (
                      <div key={sub.id} style={{ backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--primary)' }}>{sub.users?.username}</strong>
                          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>{new Date(sub.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{sub.category}</span>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{sub.description}</p>
                        
                        {sub.evidence_urls && sub.evidence_urls.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                            <strong style={{ fontSize: '0.85rem' }}>Links:</strong>
                            <ul style={{ listStyleType: 'none', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                              {sub.evidence_urls.map((u: string, i: number) => (
                                <li key={i}><a href={u} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>{u}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <div>
          {/* Members Section */}
          <section style={{ backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Team Members ({members.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {members.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{m.users?.username}</strong>
                    {m.user_id === project.creator_id && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>(Creator)</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{m.role}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: '0.25rem' }}>{m.users?.wallet_address.substring(0, 8)}...{m.users?.wallet_address.substring(38)}</div>
                </div>
              ))}
            </div>
            {isMember && (
              <button style={{ ...btnStyle, width: '100%', marginTop: '1rem', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }} onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert("Invite link copied!"))}>
                Copy Invite Link
              </button>
            )}
          </section>
        </div>
      </div>
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

const btnStyle = {
  backgroundColor: 'var(--primary)',
  color: 'var(--primary-foreground)',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius)',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer'
};
