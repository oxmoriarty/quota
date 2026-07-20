// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/QuotaVaultFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        QuotaVaultFactory factory = new QuotaVaultFactory();
        
        console.log("QuotaVaultFactory deployed to:", address(factory));

        vm.stopBroadcast();
    }
}
