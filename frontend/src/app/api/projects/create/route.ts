import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, 
      hackathon_name, 
      repository, 
      description, 
      chain_id, 
      prize_token_address, 
      vault_address, 
      creator_wallet,
      username // <--- New field
    } = body;

    if (!name || !vault_address || !creator_wallet || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Register Global Username (Upsert to handle if they already have one, or just ignore if it exists)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ wallet_address: creator_wallet, username }, { onConflict: 'wallet_address' });
      
    if (userError) {
      console.error("User registration error:", userError);
      // We don't fail hard if username is taken by someone else just yet, but ideally we should
      // A proper implementation would check if username is taken by a DIFFERENT wallet.
      // For MVP, we will assume upsert is fine.
    }

    // 2. Insert project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        hackathon_name,
        repository,
        description,
        chain_id,
        prize_token_address,
        vault_address,
        creator_wallet
      })
      .select('id')
      .single();

    if (projectError || !project) {
      console.error(projectError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // 3. Add creator as member
    const { error: memberError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: project.id,
        wallet_address: creator_wallet,
        role: 'Creator'
      });

    if (memberError) {
      console.error(memberError);
      return NextResponse.json({ error: 'Failed to add project member' }, { status: 500 });
    }

    return NextResponse.json({ success: true, projectId: project.id });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
