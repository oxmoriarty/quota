// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vault is Initializable {
    using SafeERC20 for IERC20;

    address public factory;
    address public relayer;
    address public projectCreator;
    
    // Support either native ETH (address(0)) or an ERC20 token
    address public prizeToken;
    bool public isDistributed;

    event FundsDistributed(address[] recipients, uint256[] amounts);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _relayer,
        address _projectCreator,
        address _prizeToken
    ) public initializer {
        factory = msg.sender;
        relayer = _relayer;
        projectCreator = _projectCreator;
        prizeToken = _prizeToken;
    }

    // Function to receive ETH
    receive() external payable {}

    /**
     * @dev Distributes the prize based on percentages provided by GenLayer.
     * The relayer signs the hash of (address(this), recipients, percentages).
     */
    function distribute(
        address[] calldata recipients,
        uint256[] calldata percentages,
        bytes calldata signature
    ) external {
        require(!isDistributed, "Already distributed");
        require(recipients.length == percentages.length, "Length mismatch");
        
        // Ensure percentages add up exactly to 100% (represented as 10000 for basis points)
        uint256 totalPercentage = 0;
        for (uint i = 0; i < percentages.length; i++) {
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 10000, "Percentages must total 10000 (100%)");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(address(this), recipients, percentages));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(signer == relayer, "Invalid signature");

        isDistributed = true;

        uint256 totalBalance;
        if (prizeToken == address(0)) {
            totalBalance = address(this).balance;
        } else {
            totalBalance = IERC20(prizeToken).balanceOf(address(this));
        }

        require(totalBalance > 0, "No funds to distribute");

        uint256[] memory amounts = new uint256[](recipients.length);
        
        for (uint i = 0; i < recipients.length; i++) {
            uint256 amount = (totalBalance * percentages[i]) / 10000;
            amounts[i] = amount;
            
            if (prizeToken == address(0)) {
                (bool success, ) = recipients[i].call{value: amount}("");
                require(success, "ETH transfer failed");
            } else {
                IERC20(prizeToken).safeTransfer(recipients[i], amount);
            }
        }

        emit FundsDistributed(recipients, amounts);
    }
}
