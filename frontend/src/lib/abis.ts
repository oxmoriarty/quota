import { parseAbi } from 'viem';

export const vaultFactoryAbi = parseAbi([
  'function createVault(address prizeToken) external returns (address)',
  'event VaultCreated(address indexed vault, address indexed creator, address prizeToken)'
]);

export const vaultAbi = parseAbi([
  'function distribute(address[] calldata recipients, uint256[] calldata percentages, bytes calldata signature) external',
  'function prizeToken() external view returns (address)',
  'function isDistributed() external view returns (bool)'
]);
