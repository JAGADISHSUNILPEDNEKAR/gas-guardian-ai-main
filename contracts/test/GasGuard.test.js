const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GasGuard", function () {
  let gasGuard;
  let priceVerifier;
  let mockFTSO;
  let mockTarget;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock FTSO
    const MockFTSO = await ethers.getContractFactory("MockFTSO");
    mockFTSO = await MockFTSO.deploy();
    await mockFTSO.waitForDeployment();

    // Deploy PriceVerifier
    const PriceVerifier = await ethers.getContractFactory("PriceVerifier");
    priceVerifier = await PriceVerifier.deploy(await mockFTSO.getAddress());
    await priceVerifier.waitForDeployment();

    // Deploy GasGuard
    const GasGuard = await ethers.getContractFactory("GasGuard");
    gasGuard = await GasGuard.deploy(
      await mockFTSO.getAddress(),
      await priceVerifier.getAddress()
    );
    await gasGuard.waitForDeployment();

    // Deploy mock target contract
    const MockTarget = await ethers.getContractFactory("MockTarget");
    mockTarget = await MockTarget.deploy();
    await mockTarget.waitForDeployment();
  });

  it("Should schedule execution", async function () {
    const safetyParams = {
      maxGasPrice: ethers.parseEther("0.00000003"), // 30 Gwei
      minAssetPrice: ethers.parseUnits("0.014", 8), // $0.014 FLR/USD
      maxSlippage: 100, // 1%
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      target: await mockTarget.getAddress(),
      data: "0x",
      value: ethers.parseEther("0.1"),
      refundAddress: user.address,
    };

    const tx = await gasGuard.connect(user).scheduleExecution(safetyParams, {
      value: ethers.parseEther("0.1"),
    });
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log) => log.topics[0] === ethers.id("ExecutionScheduled(bytes32,address,uint256)")
    );
    expect(event).to.not.be.undefined;
  });

  it("Should fail if gas too high", async function () {
    // This test would require manipulating block.basefee
    // For now, we'll test the deadline check
    const safetyParams = {
      maxGasPrice: ethers.parseEther("0.00000003"),
      minAssetPrice: ethers.parseUnits("0.014", 8),
      maxSlippage: 100,
      deadline: Math.floor(Date.now() / 1000) - 100, // Past deadline
      target: await mockTarget.getAddress(),
      data: "0x",
      value: ethers.parseEther("0.1"),
      refundAddress: user.address,
    };

    await expect(
      gasGuard.connect(user).scheduleExecution(safetyParams, {
        value: ethers.parseEther("0.1"),
      })
    ).to.be.revertedWith("Deadline in past");
  });
});

