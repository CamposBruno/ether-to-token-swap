// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IWETH {
    function deposit() external payable;
    function approve(address spender, uint value) external returns (bool);
}

// Author: @bhncampos
// Github: https://github.com/CamposBruno
contract TokenSwap is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    ISwapRouter public swapRouter;
    IWETH public WETH;

    event EtherToTokenSwap(address indexed recipient, address indexed token, uint amountIn, uint amountOut);

    function initialize(address routerAddress, address wethAddress) public initializer {
        require(routerAddress != address(0) && wethAddress != address(0), "Invalid address");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        swapRouter = ISwapRouter(routerAddress);
        WETH = IWETH(wethAddress);
    }

    function swapEtherToToken(address token, uint minAmount) external payable nonReentrant returns (uint amountOut) {
        require(token != address(0), "Invalid token address");
        require(token != address(WETH), "Not Allowed. Use WETH Deposit method instead");
        require(msg.value > 0, "No Ether sent");

        WETH.deposit{value: msg.value}();
        WETH.approve(address(swapRouter), msg.value);

        amountOut = swapUsingUniswap(token, minAmount);
        require(amountOut >= minAmount, "Insufficient output");

        emit EtherToTokenSwap(msg.sender, token, msg.value, amountOut);
    }

    function swapUsingUniswap(address token, uint minAmount) internal returns (uint amountOut) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(WETH),
            tokenOut: token,
            fee: 3000,
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: msg.value,
            amountOutMinimum: minAmount,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    receive() external payable {
        revert("Direct ETH not allowed");
    }
    
    fallback() external payable {
        revert("Fallback not allowed");
    }
}
