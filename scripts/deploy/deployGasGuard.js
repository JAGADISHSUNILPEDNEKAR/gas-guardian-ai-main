const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy PriceVerifier first
  const PriceVerifier = await ethers.getContractFactory("PriceVerifier");
  const ftsoAddress = process.env.FTSO_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  console.log("Deploying PriceVerifier...");
  const priceVerifier = await PriceVerifier.deploy(ftsoAddress);
  await priceVerifier.waitForDeployment();
  console.log("PriceVerifier deployed to:", await priceVerifier.getAddress());

  // Deploy GasGuard
  const GasGuard = await ethers.getContractFactory("GasGuard");
  console.log("Deploying GasGuard...");
  const gasGuard = await GasGuard.deploy(ftsoAddress, await priceVerifier.getAddress());
  await gasGuard.waitForDeployment();
  console.log("GasGuard deployed to:", await gasGuard.getAddress());

  // Deploy SmartAccountFactory
  const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
  console.log("Deploying SmartAccountFactory...");
  const factory = await SmartAccountFactory.deploy();
  await factory.waitForDeployment();
  console.log("SmartAccountFactory deployed to:", await factory.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("PriceVerifier:", await priceVerifier.getAddress());
  console.log("GasGuard:", await gasGuard.getAddress());
  console.log("SmartAccountFactory:", await factory.getAddress());
  console.log("\nSave these addresses to your .env file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

