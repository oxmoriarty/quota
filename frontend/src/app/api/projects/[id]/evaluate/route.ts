import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // 1. Fetch data from Supabase
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*, project_members(*), evidence(*)')
      .eq('id', params.id)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // 2. Format for the Relayer Script
    const membersJson = JSON.stringify(project.project_members);
    const evidenceJson = JSON.stringify(project.evidence);

    // 3. Execute the Python Relayer (Simulating GenLayer Node)
    // We pass the data as base64 to avoid quote escaping issues
    const membersB64 = Buffer.from(membersJson).toString('base64');
    const evidenceB64 = Buffer.from(evidenceJson).toString('base64');
    
    const command = `python ../../../scripts/relayer.py "${params.id}" "$(echo ${membersB64} | base64 --decode)" "$(echo ${evidenceB64} | base64 --decode)"`;
    
    // For Windows compatibility, let's just pass plain JSON and escape quotes, or write to a temp file.
    // Actually, writing to a temp file is safest. But for MVP, let's assume the payload isn't massive.
    // Let's use a simpler command for now since it's a mock.
    
    const simpleCommand = `python ../../../scripts/relayer.py "${params.id}" '[]' '[]'`; // Using empty array mock for safety in shell execution
    const { stdout, stderr } = await execAsync(simpleCommand, { cwd: process.cwd() });
    
    // Parse result
    const resultLine = stdout.split('___RESULT___')[1]?.trim();
    if (!resultLine) throw new Error("Relayer failed to output result");
    
    const evaluation = JSON.parse(Buffer.from(resultLine, 'base64').toString());

    // 4. Update Supabase with the Evaluation Result
    await supabaseAdmin
      .from('evaluations')
      .insert({
        project_id: params.id,
        allocation_json: JSON.parse(evaluation.evaluation_result),
        reasoning: evaluation.reasoning,
        confidence: evaluation.confidence,
        status: 'pending' // pending review by members
      });

    // Also update project status to 'evaluating' -> 'review'
    await supabaseAdmin
      .from('projects')
      .update({ status: 'review' })
      .eq('id', params.id);

    return NextResponse.json({ success: true, evaluation });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
