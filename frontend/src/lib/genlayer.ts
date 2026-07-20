import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

const GENLAYER_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
const GENLAYER_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || '0');
const GENLAYER_CHAIN_NAME = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || 'Custom GenLayer Network';

function getChainConfig() {
  return GENLAYER_RPC_URL ? {
    ...testnetBradbury,
    id: GENLAYER_CHAIN_ID,
    name: GENLAYER_CHAIN_NAME,
    rpcUrls: {
      default: { http: [GENLAYER_RPC_URL] }
    }
  } : testnetBradbury;
}

// Read client for public state (no wallet needed)
export function getGenLayerReadClient() {
  return createClient({
    chain: getChainConfig() as any,
    endpoint: GENLAYER_RPC_URL || undefined,
  });
}

// Write client that proxies the transaction through the user's connected MetaMask
export function getGenLayerWriteClient(walletAddress: string) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("MetaMask (window.ethereum) is required to sign this transaction.");
  }

  return createClient({
    chain: getChainConfig() as any,
    endpoint: GENLAYER_RPC_URL || undefined,
    account: walletAddress as `0x${string}`,
    provider: window.ethereum,
  });
}

export async function createProjectOnGenLayer(contractAddress: string, walletAddress: string, projectId: string) {
  console.log(`Registering project ${projectId} on GenLayer...`);
  try {
    const client = getGenLayerWriteClient(walletAddress);
    const txHash = await client.writeContract({
      address: contractAddress,
      functionName: 'create_project',
      args: [projectId],
    });
    
    console.log(`GenLayer Create TX Hash: ${txHash}`);
    // Optional: wait for receipt. If we don't await receipt, it returns immediately for snappy UI
    return txHash;
  } catch (error) {
    console.error("GenLayer create_project failed:", error);
    throw error;
  }
}

export async function closeSubmissionsOnGenLayer(contractAddress: string, walletAddress: string, projectId: string) {
  console.log(`Closing submissions for project ${projectId} on GenLayer...`);
  try {
    const client = getGenLayerWriteClient(walletAddress);
    const txHash = await client.writeContract({
      address: contractAddress,
      functionName: 'close_submissions',
      args: [projectId],
    });
    
    console.log(`GenLayer Close TX Hash: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error("GenLayer close_submissions failed:", error);
    throw error;
  }
}

export async function startAIEvaluationOnGenLayer(contractAddress: string, walletAddress: string, projectId: string, evidenceUrl: string, expectedHash: string) {
  console.log(`Starting AI Evaluation for project ${projectId} on GenLayer...`);
  
  try {
    const client = getGenLayerWriteClient(walletAddress);
    const txHash = await client.writeContract({
      address: contractAddress,
      functionName: 'evaluate_contributions',
      args: [projectId, evidenceUrl, expectedHash],
    });
    
    console.log(`GenLayer AI Eval TX Hash: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error("Error evaluating on GenLayer:", error);
    throw error;
  }
}

export async function appealOnGenLayer(contractAddress: string, accountAddress: string, projectId: string) {
  try {
    const client = getGenLayerWriteClient(accountAddress);
    
    const txHash = await client.writeContract({
      address: contractAddress,
      functionName: 'start_appeal',
      args: [projectId],
    });
    
    console.log(`GenLayer Appeal TX Hash: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error("Error appealing on GenLayer:", error);
    throw error;
  }
}

export async function getProjectFromGenLayer(contractAddress: string, projectId: string) {
  try {
    const client = getGenLayerReadClient();
    const result = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_project',
      args: [projectId],
    });
    
    // The contract returns a JSON string, so we parse it
    return JSON.parse(result as string);
  } catch (error) {
    console.error("Error reading project from GenLayer:", error);
    throw error;
  }
}
