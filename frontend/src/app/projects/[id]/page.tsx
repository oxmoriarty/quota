import { supabaseAdmin } from '@/lib/db/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select(`
      *,
      project_members (wallet_address, role),
      evidence (wallet_address, type, links, content)
    `)
    .eq('id', params.id)
    .single();

  if (error || !project) {
    return notFound();
  }

  const isLocked = project.status !== 'setup';

  return (
    <div className="container main-content">
      <header style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{project.hackathon_name}</span>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, padding: '0.2rem 0.5rem', background: 'var(--secondary)', borderRadius: 'var(--radius)' }}>
            {project.status.toUpperCase()}
          </span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.04em', marginBottom: '1rem' }}>{project.name}</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)', maxWidth: '600px' }}>{project.description}</p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>Vault Contract</span>
            <span style={{ fontFamily: 'monospace' }}>{project.vault_address}</span>
          </div>
          <div>
            <span style={{ color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>Repository</span>
            <a href={project.repository} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>View Code</a>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Team Evidence</h2>
            {!isLocked && (
              <Link href={`/projects/${project.id}/submit`} style={{ fontSize: '0.875rem', background: 'var(--primary)', color: 'var(--primary-foreground)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontWeight: 500 }}>
                Submit Evidence
              </Link>
            )}
          </div>
          
          {project.evidence.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              <p style={{ color: 'var(--muted-foreground)' }}>No evidence submitted yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {project.evidence.map((ev: any, i: number) => (
                <div key={i} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{ev.wallet_address.slice(0, 6)}...{ev.wallet_address.slice(-4)}</span>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', background: 'var(--secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{ev.type}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--card-foreground)', whiteSpace: 'pre-wrap' }}>{ev.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Members ({project.project_members.length})</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.project_members.map((m: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--secondary)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{m.wallet_address.slice(0,6)}...{m.wallet_address.slice(-4)}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{m.role}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <h3 style={{ fontWeight: 500, marginBottom: '0.5rem' }}>GenLayer Evaluation</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Once the hackathon ends and the vault is locked, the AI will evaluate the evidence.
            </p>
            <button style={{ width: '100%', padding: '0.75rem', background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontWeight: 500 }}>
              Trigger Evaluation
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
