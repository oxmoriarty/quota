import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getGenLayerReadClient } from '@/lib/genlayer';
import { keccak256, encodePacked, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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

    // 1. Fetch project from Supabase
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.vault_address) {
      return NextResponse.json({ error: 'No EVM Vault address linked to project' }, { status: 400 });
    }

    // 2. Read exact finalized state DIRECTLY from the GenLayer on-chain contract
    const contractAddress = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === 'GLMockContract123') {
      return NextResponse.json({ error: 'GenLayer contract not configured' }, { status: 500 });
    }

    const client = getGenLayerReadClient();
    const rawResult = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_project',
      args: [projectId],
    });

    const glProject = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

    // 3. Strict verification: must be finalized by GenLayer AI consensus
    if (glProject.status !== 'Allocation Finalized' && glProject.status !== 'Appeal Resolved') {
      return NextResponse.json({
        error: `GenLayer evaluation is not finalized on-chain. Current status: ${glProject.status}`
      }, { status: 400 });
    }

    if (!Array.isArray(glProject.allocations) || glProject.allocations.length === 0) {
      return NextResponse.json({ error: 'No allocations found in GenLayer contract state' }, { status: 400 });
    }

    // Verify vault addresses match
    if (glProject.vault_address.toLowerCase() !== project.vault_address.toLowerCase()) {
      return NextResponse.json({ error: 'Vault address mismatch between GenLayer and database' }, { status: 400 });
    }

    // 4. Extract exact recipients and percentages from GenLayer state
    const recipients: `0x${string}`[] = glProject.allocations.map((a: any) => getAddress(a.wallet));
    const percentages: bigint[] = glProject.allocations.map((a: any) => BigInt(Math.round(Number(a.percentage))));

    // Validate 10000 basis points sum
    const totalPercentage = percentages.reduce((acc, curr) => acc + curr, BigInt(0));
    if (totalPercentage !== BigInt(10000)) {
      return NextResponse.json({ error: `Total percentage must equal 10000, got ${totalPercentage.toString()}` }, { status: 400 });
    }

    // 5. Compute cryptographic message hash bound to (vaultAddress, recipients, percentages)
    const vaultAddress = getAddress(project.vault_address);
    const messageHash = keccak256(
      encodePacked(
        ['address', 'address[]', 'uint256[]'],
        [vaultAddress, recipients, percentages]
      )
    );

    // 6. Sign with the official GenLayer Relayer/Oracle Key
    const relayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.GENLAYER_PRIVATE_KEY;
    if (!relayerKey || relayerKey === 'your_private_key') {
      return NextResponse.json({ error: 'Relayer private key is not configured' }, { status: 500 });
    }

    const relayerAccount = privateKeyToAccount(relayerKey.startsWith('0x') ? relayerKey as `0x${string}` : `0x${relayerKey}`);
    const signature = await relayerAccount.signMessage({
      message: { raw: messageHash }
    });

    return NextResponse.json({
      success: true,
      vaultAddress,
      recipients,
      percentages: percentages.map(p => p.toString()),
      messageHash,
      signature,
      relayerAddress: relayerAccount.address,
      status: glProject.status
    });

  } catch (error: any) {
    console.error('Error generating payout signature:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
