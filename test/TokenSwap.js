const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenSwap", function () {
  let tokenSwap;
  let WETH;
  let DAI;
  let swapRouter;
  let owner;

  beforeEach(async function () {
     // Deploy mock WETH token
     const MockWETH = await ethers.getContractFactory("MockWETH");
     WETH = await MockWETH.deploy();
     await WETH.waitForDeployment();

     const MockDAI = await ethers.getContractFactory("MockDAI");
     DAI = await MockDAI.deploy();
     await DAI.waitForDeployment();

    //  // Deploy mock SwapRouter
    const MockSwapRouter = await ethers.getContractFactory("MockSwapRouter");
    swapRouter = await MockSwapRouter.deploy(WETH.target);
    await swapRouter.waitForDeployment();

    // Deploy and initialize TokenSwap contract
    const TokenSwap = await ethers.getContractFactory("TokenSwap");
    tokenSwap = await upgrades.deployProxy(TokenSwap, [await swapRouter.getAddress(), await WETH.getAddress()], {});
    await tokenSwap.waitForDeployment();

    [owner] = await ethers.getSigners();
  });

  it("Should not receive ETH directly", async function () {
    await expect(
      owner.sendTransaction({
        to: tokenSwap.getAddress(),
        value: ethers.parseEther("1")
      })
    ).to.be.revertedWith("Direct ETH not allowed");
  });

  it("Should not initialize more than once", async function () {
    await expect(tokenSwap.initialize(swapRouter.getAddress(), WETH.getAddress()))
      .to.be.reverted;
  });

  it("Should not execute swapEtherToToken without sending ETH", async function () {
    await expect(tokenSwap.swapEtherToToken(DAI.getAddress(), ethers.parseEther('10'), { value : ethers.parseEther('0') }))
      .to.be.revertedWith('No Ether sent');
  });
  
  it("Should not execute swapEtherToToken for an invalid token address", async function () {
    await expect(tokenSwap.swapEtherToToken(ethers.ZeroAddress,  ethers.parseEther('10')))
      .to.be.revertedWith('Invalid token address');
  });

  it("Should revert if the swap do not transfer the minimum amount to msg.sender", async function() {
    const minimumAmountOut = ethers.parseEther('100')
    const actualAmountOut = ethers.parseEther('99');
    
    // set amount to transfer less than minimum amount
    await swapRouter.setAmountToTransfer(actualAmountOut);

    // mint DAI to swap router
    await DAI.mint(swapRouter.getAddress(), actualAmountOut)

    await expect(tokenSwap.swapEtherToToken(DAI.getAddress(), minimumAmountOut, { value: ethers.parseEther('1') }))
      .to.be.revertedWith("Insufficient output");

    const amountSwapped = await DAI.balanceOf(owner.getAddress());
    expect(amountSwapped).to.equal(ethers.parseEther('0'));
  });

  it("Should revert if try to swap Ether for WETH", async function() {
    const amountEtherSent = ethers.parseEther('1');
    const minimumAmountOut = ethers.parseEther('1')

    // Check if transaction was reverted
    await expect(tokenSwap.swapEtherToToken(WETH.getAddress(), minimumAmountOut, { value: amountEtherSent }))
      .to.be.revertedWith("Not Allowed. Use WETH Deposit method instead");
  });

  it("Should swap Ether for DAI sucessfully", async function() {
    const amountEtherSent = ethers.parseEther('1');
    const minimumAmountOut = ethers.parseEther('100')

    // Mint DAI to swap router
    await DAI.mint(swapRouter.getAddress(), minimumAmountOut)

    // Execute transaction
    const swapTransaction = await tokenSwap.swapEtherToToken(DAI.getAddress(), minimumAmountOut, { value: amountEtherSent });

    // Check if transaction was succesfull
    await expect(swapTransaction).to.not.be.reverted;

    // Check if Events were emited
    await expect(swapTransaction).to.emit(WETH, 'Deposit')
      .withArgs(tokenSwap.getAddress(), amountEtherSent);

    await expect(swapTransaction).to.emit(tokenSwap, 'EtherToTokenSwap')
      .withArgs(owner.getAddress(), DAI.getAddress(), amountEtherSent, minimumAmountOut);

    // Check approval amount for mockSwapRouter to spend WETH on behalf of TokenSwap contract
    const allowance = await WETH.allowance(tokenSwap.getAddress(), swapRouter.getAddress());
    expect(allowance).to.equal(amountEtherSent);

    // Check that the recipient received the swapped tokens
    const amountSwapped = await DAI.balanceOf(owner.getAddress());
    expect(amountSwapped).to.equal(minimumAmountOut);

  });
});
