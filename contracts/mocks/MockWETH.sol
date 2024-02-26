// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWETH is ERC20 {

    event Deposit(address indexed dst, uint wad);

    constructor() ERC20("Wrapped Ether", "WETH") {}
    
    // Simulate the deposit function to receive ETH and mint WETH
    function deposit() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Allow anyone to send ETH to the contract and automatically deposit
    receive() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
}