import { supabaseAdmin } from '@/lib/db/supabase';
import Link from 'next/link';

export const revalidate = 0; // Disable caching so new projects appear immediately

export default async function ExploreProjectsPage() {
  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('*, project_members(count)')
    .order('created_at', { ascending: false });

  return (
    <div className="container main-content animate-fade-in stagger-1">
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem' }}>Explore Projects</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)', maxWidth: '600px', margin: '0 auto' }}>
          Discover hackathon projects currently utilizing Quota for fair prize distribution.
        </p>
      </header>

      {error ? (
        <p style={{ color: 'var(--destructive)' }}>Failed to load projects.</p>
      ) : projects?.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', background: 'transparent', borderStyle: 'dashed' }}>
          <p style={{ color: 'var(--muted-foreground)' }}>No projects found. Be the first to deploy a vault!</p>
          <Link href="/create" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Create Project</Link>
        </div>
      ) : (
        <div className="grid-3 animate-fade-in stagger-2">
          {projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} style={{ display: 'block' }}>
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>{project.hackathon_name}</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '9999px',
                    border: '1px solid var(--border)' 
                  }}>
                    {project.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{project.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {project.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span>{project.project_members[0].count} Members</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--foreground)' }}>{project.vault_address.slice(0,6)}...</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
