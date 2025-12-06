const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get FTSO address or use mock
  let ftsoAddress = process.env.FTSO_ADDRESS;
  
  // If no FTSO address, deploy mock for testing
  if (!ftsoAddress || ftsoAddress === "0x0000000000000000000000000000000000000000") {
    console.log("No FTSO address provided, deploying MockFTSO...");
    const MockFTSO = await ethers.getContractFactory("MockFTSO");
    const mockFTSO = await MockFTSO.deploy();
    await mockFTSO.waitForDeployment();
    ftsoAddress = await mockFTSO.getAddress();
    console.log("MockFTSO deployed to:", ftsoAddress);
  }

  // Deploy PriceVerifier
  console.log("Deploying PriceVerifier...");
  const PriceVerifier = await ethers.getContractFactory("PriceVerifier");
  const priceVerifier = await PriceVerifier.deploy(ftsoAddress);
  await priceVerifier.waitForDeployment();
  const priceVerifierAddress = await priceVerifier.getAddress();
  console.log("PriceVerifier deployed to:", priceVerifierAddress);

  // Deploy GasGuard
  console.log("Deploying GasGuard...");
  const GasGuard = await ethers.getContractFactory("GasGuard");
  const gasGuard = await GasGuard.deploy(ftsoAddress, priceVerifierAddress);
  await gasGuard.waitForDeployment();
  const gasGuardAddress = await gasGuard.getAddress();
  console.log("GasGuard deployed to:", gasGuardAddress);

  // Deploy SmartAccountFactory
  console.log("Deploying SmartAccountFactory...");
  const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
  const factory = await SmartAccountFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("SmartAccountFactory deployed to:", factoryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("FTSO Address:", ftsoAddress);
  console.log("PriceVerifier:", priceVerifierAddress);
  console.log("GasGuard:", gasGuardAddress);
  console.log("SmartAccountFactory:", factoryAddress);
  
  console.log("\n=== Update your .env files with these addresses ===");
  console.log(`VITE_FTSO_ADDRESS=${ftsoAddress}`);
  console.log(`VITE_GASGUARD_ADDRESS=${gasGuardAddress}`);
  console.log(`VITE_FACTORY_ADDRESS=${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

