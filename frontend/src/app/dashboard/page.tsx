'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const { address } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!address) return;
      
      try {
        // Fetch User
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();
          
        if (userData) setUser(userData);

        // Fetch Projects (where user is creator or team member)
        if (userData) {
          const { data: memberProjects, error: memberError } = await supabase
            .from('team_members')
            .select('project_id')
            .eq('user_id', userData.id);
            
          const projectIds = memberProjects?.map(mp => mp.project_id) || [];
          
          const { data: projData, error: projError } = await supabase
            .from('projects')
            .select('*')
            .or(`creator_id.eq.${userData.id},id.in.(${projectIds.length > 0 ? projectIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);
            
          if (projData) setProjects(projData);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [address]);

  if (loading) return <div className="container main-content">Loading...</div>;

  const ongoingProjects = projects.filter(p => p.status === 'Submissions Open');
  const evaluatingProjects = projects.filter(p => p.status !== 'Submissions Open' && p.status !== 'Distribution Complete' && p.status !== 'No Prize Awarded');
  const completedProjects = projects.filter(p => p.status === 'Distribution Complete' || p.status === 'No Prize Awarded');

  return (
    <div className="container main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome, {user?.username}</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>{address}</p>
        </div>
        <Link href="/create" style={{
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius)',
          fontWeight: 500
        }}>
          + Create Project
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
        <div>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Ongoing Projects</h2>
            {ongoingProjects.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)' }}>No ongoing projects.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ongoingProjects.map(p => (
                  <Link key={p.id} href={`/project/${p.id}`} style={{
                    display: 'block',
                    padding: '1.5rem',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{p.hackathon} &bull; Status: {p.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>In Evaluation & Appeals</h2>
            {evaluatingProjects.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)' }}>No projects currently under evaluation.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {evaluatingProjects.map(p => (
                  <Link key={p.id} href={`/project/${p.id}`} style={{
                    display: 'block',
                    padding: '1.5rem',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{p.hackathon} &bull; Status: {p.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
          <section style={{ marginBottom: '3rem', backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Activity</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>No recent activity to show.</p>
          </section>

          <section style={{ backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Completed Projects</h2>
            {completedProjects.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>No completed projects.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {completedProjects.map(p => (
                  <Link key={p.id} href={`/project/${p.id}`} style={{ display: 'block', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <h4 style={{ fontSize: '1rem' }}>{p.name}</h4>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
