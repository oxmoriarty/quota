import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json();
    const { wallet_address, type, content, links } = body;

    if (!wallet_address || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('evidence')
      .insert({
        project_id: params.id,
        wallet_address,
        type,
        content,
        links
      });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Fetch submissions with the user's wallet address
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        id,
        category,
        description,
        evidence_urls,
        users!inner(wallet_address)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json([]);
    }

    // Format for the GenLayer LLM prompt
    const formattedEvidence = submissions.map((sub: any) => ({
      wallet: sub.users?.wallet_address,
      contribution_type: sub.category,
      description: sub.description,
      links: sub.evidence_urls
    }));

    return NextResponse.json(formattedEvidence);
    
  } catch (error: any) {
    console.error('Evidence API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
