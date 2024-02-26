// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct ISwapParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}

contract MockSwapRouter {
    IERC20 public wethToken;
    uint256 public amountToTransfer;

    // Event for logging swap details (optional, for testing visibility)
    event SwapExecuted(address sender, address tokenOut, uint amountIn, uint amountOut);

    constructor(address _wethToken) {
        wethToken = IERC20(_wethToken);
    }

    // Mock implementation of the exactInputSingle function
    function exactInputSingle(ISwapParams memory params) external returns (uint256 amountOut) {
        // Simplified swap logic for testing purposes
        // For example, always succeed and transfer `amountOutMinimum` tokens to `recipient`        

        // condition to test minimun amount returned
        amountOut = amountToTransfer > 0 ? amountToTransfer : params.amountOutMinimum;

        // Assume `tokenOut` is another ERC20 token (not WETH, which should be handled differently)
        IERC20(params.tokenOut).transfer(params.recipient, amountOut);

        emit SwapExecuted(msg.sender, params.tokenOut, params.amountIn, amountOut);
    }

    // Mock function to allow this contract to receive ERC20 tokens
    // Remember to call `approve` from the test script before executing swaps that require transferring tokens
    function receiveTokens(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    // function used to test minimum amount transfered
    function setAmountToTransfer(uint256 _amountToTransfer) external {
        amountToTransfer = _amountToTransfer;
    }
}
