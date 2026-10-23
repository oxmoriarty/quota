import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const GENLAYER_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
const GENLAYER_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || '61999');
const GENLAYER_CHAIN_NAME = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || 'Genlayer Studio Network';

export async function ensureGenLayerNetwork() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainIdHex, 16) !== GENLAYER_CHAIN_ID) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${GENLAYER_CHAIN_ID.toString(16)}` }],
          });
          await new Promise(r => setTimeout(r, 1500)); // wait for provider state to catch up
        } catch (e: any) {
          if (e.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${GENLAYER_CHAIN_ID.toString(16)}`,
                chainName: GENLAYER_CHAIN_NAME,
                rpcUrls: [GENLAYER_RPC_URL || 'https://studio.genlayer.com/api'],
                nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 }
              }]
            });
            await new Promise(r => setTimeout(r, 1500));
          } else {
            throw e;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to check/switch network:", e);
    }
  }
}

function getChainConfig() {
  return GENLAYER_RPC_URL ? {
    ...studionet,
    id: GENLAYER_CHAIN_ID,
    name: GENLAYER_CHAIN_NAME,
    rpcUrls: {
      default: { http: [GENLAYER_RPC_URL] }
    }
  } : studionet;
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
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error("MetaMask (window.ethereum) is required to sign this transaction.");
  }

  return createClient({
    chain: getChainConfig() as any,
    endpoint: GENLAYER_RPC_URL || undefined,
    account: walletAddress as `0x${string}`,
    provider: (window as any).ethereum,
  });
}

export async function createProjectOnGenLayer(contractAddress: string, walletAddress: string, projectId: string, vaultAddress: string) {
  console.log(`Registering project ${projectId} on GenLayer...`);
  try {
    await ensureGenLayerNetwork();
    const client = getGenLayerWriteClient(walletAddress);
    const txHash = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName: 'create_project',
      args: [projectId, vaultAddress],
      value: BigInt(0),
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
    await ensureGenLayerNetwork();
    const client = getGenLayerWriteClient(walletAddress);
    const txHash = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName: 'close_submissions',
      args: [projectId],
      value: BigInt(0),
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
    await ensureGenLayerNetwork();
    const client = getGenLayerWriteClient(walletAddress);
    const txHash = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName: 'evaluate_contributions',
      args: [projectId, evidenceUrl, expectedHash],
      value: BigInt(0),
    });
    
    console.log(`GenLayer AI Eval TX Hash: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error("Error evaluating on GenLayer:", error);
    throw error;
  }
}

export async function appealOnGenLayer(contractAddress: string, accountAddress: string, projectId: string, evidenceUrl: string, expectedHash: string) {
  try {
    await ensureGenLayerNetwork();
    const client = getGenLayerWriteClient(accountAddress);
    
    const txHash = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName: 'evaluate_appeal',
      args: [projectId, evidenceUrl, expectedHash],
      value: BigInt(0),
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

export async function getGenLayerTransactionStatus(txHash: string) {
  if (!txHash) return null;
  try {
    const client = getGenLayerReadClient();
    if (typeof (client as any).getTransactionReceipt === 'function') {
      try {
        const receipt = await (client as any).getTransactionReceipt({ hash: txHash });
        if (receipt) return receipt;
      } catch (e) {
        // Fallback to json-rpc fetch
      }
    }
    const rpcUrl = GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })
    });
    const json = await res.json();
    return json?.result || null;
  } catch (error) {
    console.warn("Could not fetch GenLayer transaction receipt:", error);
    return null;
  }
}
