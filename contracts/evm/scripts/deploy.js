const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of Quota Vault Factory...");

  // Deploy Vault Factory
  const VaultFactory = await hre.ethers.getContractFactory("QuotaVaultFactory");
  const factory = await VaultFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log(`Vault Factory deployed to: ${factoryAddress}`);
  console.log("-------------------------------------------------");
  console.log("Deployment Complete!");
  console.log("Please update your frontend constants:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS="${factoryAddress}"`);
  console.log("-------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
