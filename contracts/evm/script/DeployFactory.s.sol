// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/VaultFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress = vm.envOr("RELAYER_ADDRESS", vm.addr(deployerPrivateKey));
        
        vm.startBroadcast(deployerPrivateKey);

        VaultFactory factory = new VaultFactory(relayerAddress);
        
        console.log("VaultFactory deployed to:", address(factory));
        console.log("Configured Relayer Address:", relayerAddress);

        vm.stopBroadcast();
    }
}
