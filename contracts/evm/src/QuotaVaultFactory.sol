// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QuotaVault.sol";

contract QuotaVaultFactory {
    event VaultDeployed(address indexed creator, address vaultAddress);

    // Array to keep track of all deployed vaults
    address[] public deployedVaults;

    function createVault() external returns (address) {
        // Deploy a new QuotaVault and assign ownership to the caller
        QuotaVault newVault = new QuotaVault(msg.sender);
        
        deployedVaults.push(address(newVault));
        emit VaultDeployed(msg.sender, address(newVault));
        
        return address(newVault);
    }
}
