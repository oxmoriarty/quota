'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function SubmitEvidencePage({ params }: { params: { id: string } }) {
  const { address } = useAccount();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    type: 'Code',
    content: '',
    link: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert('Connect wallet first.');
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${params.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          type: formData.type,
          content: formData.content,
          links: formData.link ? [formData.link] : []
        })
      });

      if (res.ok) {
        router.push(`/projects/${params.id}`);
        router.refresh();
      } else {
        alert('Failed to submit evidence');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Submit Evidence</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
        Provide structured evidence of your contributions for the AI evaluation.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contribution Type</label>
          <select 
            required
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--foreground)' }}
          >
            <option value="Code">Code / Implementation</option>
            <option value="Architecture">Architecture / Design</option>
            <option value="UI/UX">UI / UX Design</option>
            <option value="Research">Research & Strategy</option>
            <option value="Documentation">Documentation</option>
            <option value="Leadership">Leadership & Management</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
          <textarea 
            required
            rows={5}
            placeholder="Summarize what you built or achieved..."
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--foreground)', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Supporting Link (Optional)</label>
          <input 
            type="url"
            placeholder="https://github.com/pulls/..."
            value={formData.link}
            onChange={e => setFormData({...formData, link: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--foreground)' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !address}
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontWeight: 600,
            opacity: (loading || !address) ? 0.7 : 1
          }}
        >
          {loading ? 'Submitting...' : 'Submit Evidence'}
        </button>
      </form>
    </div>
  );
}
