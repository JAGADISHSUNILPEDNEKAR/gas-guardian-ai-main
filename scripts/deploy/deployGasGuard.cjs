const hre = require("hardhat");

async function main() {
  const accounts = await hre.ethers.getSigners();

  if (!accounts || accounts.length === 0) {
    throw new Error("❌ No signer accounts available. Check your network config and PRIVATE_KEY in .env");
  }

  const deployer = accounts[0];

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Flare Coston2 Testnet addresses
  // ContractRegistry: 0x1000000000000000000000000000000000000001
  // FTSOv2 (Test): 0x1000000000000000000000000000000000000003
  const contractRegistryAddress = process.env.CONTRACT_REGISTRY_ADDRESS || "0x1000000000000000000000000000000000000001";
  const ftsoV2Address = process.env.FTSO_V2_ADDRESS || process.env.FTSO_ADDRESS || "0x1000000000000000000000000000000000000003";
  
  console.log("Using ContractRegistry at:", contractRegistryAddress);
  console.log("Using FTSOv2 at:", ftsoV2Address);

  // Deploy PriceVerifier (needs FTSOv2 and ContractRegistry addresses)
  console.log("Deploying PriceVerifier...");
  const PriceVerifier = await hre.ethers.getContractFactory("PriceVerifier");
  const priceVerifier = await PriceVerifier.deploy(ftsoV2Address, contractRegistryAddress);
  await priceVerifier.waitForDeployment();
  const priceVerifierAddress = await priceVerifier.getAddress();
  console.log("PriceVerifier deployed to:", priceVerifierAddress);

  // Deploy GasGuard (only needs PriceVerifier)
  console.log("Deploying GasGuard...");
  const GasGuard = await hre.ethers.getContractFactory("GasGuard");
  const gasGuard = await GasGuard.deploy(priceVerifierAddress);
  await gasGuard.waitForDeployment();
  const gasGuardAddress = await gasGuard.getAddress();
  console.log("GasGuard deployed to:", gasGuardAddress);

  // Deploy SmartAccountFactory
  console.log("Deploying SmartAccountFactory...");
  const SmartAccountFactory = await hre.ethers.getContractFactory("SmartAccountFactory");
  const factory = await SmartAccountFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("SmartAccountFactory deployed to:", factoryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("ContractRegistry:", contractRegistryAddress);
  console.log("FTSOv2:", ftsoV2Address);
  console.log("PriceVerifier:", priceVerifierAddress);
  console.log("GasGuard:", gasGuardAddress);
  console.log("SmartAccountFactory:", factoryAddress);
  
  console.log("\n=== Update your .env files with these addresses ===");
  console.log(`VITE_FTSO_CONTRACT_ADDRESS=${ftsoV2Address}`);
  console.log(`VITE_CONTRACT_REGISTRY_ADDRESS=${contractRegistryAddress}`);
  console.log(`VITE_GASGUARD_CONTRACT_ADDRESS=${gasGuardAddress}`);
  console.log(`VITE_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`\nBackend .env:`);
  console.log(`FTSO_CONTRACT_ADDRESS=${ftsoV2Address}`);
  console.log(`CONTRACT_REGISTRY_ADDRESS=${contractRegistryAddress}`);
  console.log(`GASGUARD_CONTRACT_ADDRESS=${gasGuardAddress}`);
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
