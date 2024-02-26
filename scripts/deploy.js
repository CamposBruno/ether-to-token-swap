const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {

  const TokenSwap = await ethers.getContractFactory("TokenSwap");

  const SwapRouterAddress = process.env.SWAP_ROUTER_ADDRESS;
  const WETHAddress = process.env.WETH_ADDRESS;

  const TokenSwapContract = await upgrades.deployProxy(TokenSwap, [SwapRouterAddress, WETHAddress], {});

  await TokenSwapContract.waitForDeployment();

  // console.log(TokenSwapContract)

  console.log('TokenSwap Deployed to ', await TokenSwapContract.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
