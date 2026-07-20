// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Vault.sol";

contract VaultFactory {
    address public implementation;
    address public relayer;

    event VaultCreated(address indexed vault, address indexed creator, address prizeToken);

    constructor(address _relayer) {
        implementation = address(new Vault());
        relayer = _relayer;
    }

    function createVault(address prizeToken) external returns (address) {
        address clone = Clones.clone(implementation);
        Vault(payable(clone)).initialize(relayer, msg.sender, prizeToken);
        emit VaultCreated(clone, msg.sender, prizeToken);
        return clone;
    }
}
