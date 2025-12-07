require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    flare: {
      url: process.env.FLARE_RPC_URL || "https://flare-api.flare.network/ext/C/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 14,
      gasPrice: 25000000000, // 25 gwei
    },
    coston2: {
      url: process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 114,
      gasPrice: 25000000000, // 25 gwei
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./contracts/test",
    cache: "./cache",
    artifacts: "./artifacts",
    scripts: "./scripts",
  },
  // Exclude mocks from compilation (only needed for tests)
  // They can be compiled separately if needed for testing
};

