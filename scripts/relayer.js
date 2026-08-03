const { ethers } = require("ethers");
const { execSync } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from the evm folder where PRIVATE_KEY usually lives
dotenv.config({ path: path.join(__dirname, "../contracts/evm/.env") });

async function main() {
    const projectId = process.argv[2];
    const genlayerContract = process.argv[3];
    const privateKey = process.env.PRIVATE_KEY;

    if (!projectId || !genlayerContract || !privateKey) {
        console.error("Usage: node relayer.js <projectId> <genlayerContractAddress>");
        console.error("Ensure PRIVATE_KEY is set in contracts/evm/.env");
        process.exit(1);
    }

    console.log(`Relayer started for Project: ${projectId}`);
    
    // 1. Fetch from GenLayer
    try {
        console.log(`Fetching project state from GenLayer contract ${genlayerContract}...`);
        
        // Use GenLayer CLI to read the state
        const command = `genlayer contract call ${genlayerContract} get_project '["${projectId}"]'`;
        const output = execSync(command).toString();
        
        // Extract the JSON string from the CLI output
        // It might be formatted or escaped depending on the CLI version.
        const match = output.match(/(\{.*\})/s);
        if (!match) {
            throw new Error(`Could not parse project JSON from GenLayer response.\nRaw Output: ${output}`);
        }
        
        // Clean up escaped quotes if any exist
        let rawJson = match[1];
        if (rawJson.includes('\\"')) {
            rawJson = rawJson.replace(/\\"/g, '"');
        }
        
        const projectData = JSON.parse(rawJson);
        
        if (projectData.status !== "Allocation Finalized") {
            console.error(`Project is not finalized! Current status: ${projectData.status}`);
            process.exit(1);
        }

        const vaultAddress = projectData.vault_address;
        const allocations = projectData.allocations;

        if (!vaultAddress || !allocations || allocations.length === 0) {
            console.error("Invalid project data missing vault_address or allocations.");
            process.exit(1);
        }

        // 2. Prepare Data for Signing
        const recipients = allocations.map(a => a.wallet);
        const percentages = allocations.map(a => Number(a.percentage));

        console.log(`\nFound Vault: ${vaultAddress}`);
        console.log(`Recipients: ${recipients}`);
        console.log(`Percentages: ${percentages}`);

        // 3. Generate the cryptographic signature
        const wallet = new ethers.Wallet(privateKey);
        
        // Equivalent to Solidity: keccak256(abi.encodePacked(address(this), recipients, percentages))
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "address[]", "uint256[]"],
            [vaultAddress, recipients, percentages]
        );

        // Sign the hash (adds the standard Ethereum signed message prefix automatically)
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));
        
        console.log("\n=================================");
        console.log("SUCCESS! Signature Generated.");
        console.log("=================================");
        console.log("Relayer Address:", wallet.address);
        console.log("Vault Address:", vaultAddress);
        console.log("Signature:\n" + signature);
        console.log("\nProvide this signature to the frontend so a user can call distribute() on EVM.");
    } catch (e) {
        console.error("Relayer Error:", e.message);
    }
}

main();
