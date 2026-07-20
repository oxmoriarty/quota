require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient, createAccount } = require('genlayer-js');
const { simulator } = require('genlayer-js/chains');

const GENLAYER_RPC_URL = process.env.GENLAYER_RPC_URL;
const GENLAYER_CHAIN_ID = parseInt(process.env.GENLAYER_CHAIN_ID || '0');
const GENLAYER_CHAIN_NAME = process.env.GENLAYER_CHAIN_NAME || 'Custom GenLayer Network';

// NOTE: We are using the GenLayer testnet simulator endpoint (or Bradbury if available in the SDK)
// Since `genlayer-js/chains` handles the predefined testnets, we connect to it using the user's private key.

async function main() {
    console.log("Initializing GenLayer Client...");

    // Get the private key from the environment (the user's wallet)
    const privateKey = process.env.GENLAYER_PRIVATE_KEY;
    if (!privateKey) {
        console.error("Please set GENLAYER_PRIVATE_KEY environment variable.");
        process.exit(1);
    }

    const account = createAccount(privateKey);
    
    const chainConfig = GENLAYER_RPC_URL ? {
        id: GENLAYER_CHAIN_ID,
        name: GENLAYER_CHAIN_NAME,
        rpcUrls: {
            default: { http: [GENLAYER_RPC_URL] }
        }
    } : simulator;

    const client = createClient({
        chain: chainConfig,
        endpoint: GENLAYER_RPC_URL || undefined,
        account,
    });

    console.log(`Connected with account: ${account.address}`);

    const contractPath = path.join(__dirname, 'QuotaRegistry.py');
    console.log(`Deploying ${contractPath}...`);
    const contractCode = fs.readFileSync(contractPath, 'utf-8');

    try {
        // Since deployContract might not be available in 0.1.0, this script acts as a placeholder
        // and we encourage using the GenLayer CLI. But if using a newer SDK, this works:
        const txHash = await client.writeContract({
            // GenLayer doesn't use standard writeContract for deploy in viem, but we use CLI now.
        });
        // Let's actually just tell them to use the CLI in the console.log
        console.log("NOTE: genlayer-js v0.1.0 does not fully export deployContract yet.");
        console.log("Please use the GenLayer CLI to deploy the Registry contract:");
        console.log("  genlayer deploy --contract QuotaRegistry.py --rpc https://rpc-bradbury.genlayer.com");
    } catch (error) {
        console.error("Deployment via SDK failed, please use CLI.");
    }
}

main();
