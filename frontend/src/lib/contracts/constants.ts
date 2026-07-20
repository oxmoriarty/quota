export const VAULT_FACTORY_ABI = [
  "function createVault(address prizeToken) external returns (address)",
  "event VaultCreated(address indexed vault, address indexed creator, address prizeToken)"
];

// Pull the deployed Base Sepolia factory address from environment variables
export const VAULT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";

// Standard ERC20 / Native token config
export const TOKENS = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Example Base Sepolia USDC address
};
