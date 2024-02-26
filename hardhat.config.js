require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("dotenv").config()

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    goerli: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
  gasReporter: {
    enabled: true,
    currency: 'EUR',
    gasPrice: 21,
    coinmarketcap: process.env.COINMARKETCAP_APIKEY,
    onlyCalledMethods: true,
    excludeContracts: ['contracts/mocks']
  }
};
