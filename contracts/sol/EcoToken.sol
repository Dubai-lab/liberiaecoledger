// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title EcoToken — ERC-20 reward token for Liberia EcoLedger
contract EcoToken is ERC20, Ownable {
    constructor() ERC20("EcoToken", "ECO") Ownable(msg.sender) {}

    /// @notice Mint ECO tokens to a recipient (only owner/EcoLedger contract)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
