// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal interface for ERC20 transfers
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract QuotaVault {
    address public owner;
    bool public hasDistributed;

    event PrizeReceived(address indexed token, uint256 amount);
    event DistributionExecuted(address indexed token, uint256 totalAmount);
    event Payout(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    // Allows the vault to receive native currency (if the prize is native)
    receive() external payable {
        emit PrizeReceived(address(0), msg.value);
    }

    // Explicit function to acknowledge an ERC20 prize was sent here
    function logERC20Deposit(address token, uint256 amount) external {
        emit PrizeReceived(token, amount);
    }

    /**
     * @dev Executes the payout distribution.
     * @param token The address of the prize token (address(0) for native token).
     * @param recipients The array of team member addresses.
     * @param percentages The array of allocation percentages (in basis points, 10000 = 100%).
     */
    function executeDistribution(
        address token,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external onlyOwner {
        require(!hasDistributed, "Already distributed");
        require(recipients.length == percentages.length, "Mismatched arrays");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 10000, "Total must be 10000 (100%)");

        hasDistributed = true;

        if (token == address(0)) {
            // Distribute native token
            uint256 totalBalance = address(this).balance;
            for (uint256 i = 0; i < recipients.length; i++) {
                uint256 amount = (totalBalance * percentages[i]) / 10000;
                if (amount > 0) {
                    (bool success, ) = recipients[i].call{value: amount}("");
                    require(success, "Native transfer failed");
                    emit Payout(recipients[i], amount);
                }
            }
            emit DistributionExecuted(token, totalBalance);
        } else {
            // Distribute ERC20
            IERC20 prizeToken = IERC20(token);
            uint256 totalBalance = prizeToken.balanceOf(address(this));
            for (uint256 i = 0; i < recipients.length; i++) {
                uint256 amount = (totalBalance * percentages[i]) / 10000;
                if (amount > 0) {
                    require(prizeToken.transfer(recipients[i], amount), "ERC20 transfer failed");
                    emit Payout(recipients[i], amount);
                }
            }
            emit DistributionExecuted(token, totalBalance);
        }
    }
}
