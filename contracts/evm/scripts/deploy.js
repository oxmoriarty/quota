const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of Vault Factory...");

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  
  // Use RELAYER_ADDRESS from env if provided, otherwise default to the deployer's address
  const relayerAddress = process.env.RELAYER_ADDRESS || deployer.address;
  console.log(`Using Relayer Address: ${relayerAddress}`);

  // Deploy Vault Factory
  const VaultFactory = await hre.ethers.getContractFactory("VaultFactory");
  const factory = await VaultFactory.deploy(relayerAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log(`Vault Factory deployed to: ${factoryAddress}`);
  console.log("-------------------------------------------------");
  console.log("Deployment Complete!");
  console.log("Please update your frontend constants:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS="${factoryAddress}"`);
  console.log(`NEXT_PUBLIC_RELAYER_ADDRESS="${relayerAddress}"`);
  console.log("-------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
