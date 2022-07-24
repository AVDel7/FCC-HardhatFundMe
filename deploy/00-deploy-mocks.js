// Deploy mock (fake contract) for Chainlink pricefeed contract
const { network } = require("hardhat")
const {
  developmentChains,
  DECIMALS,
  INITIAL_PRICE,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainID = network.config.chainID

  if (developmentChains.includes(network.name)) {
    // Within any development chains
    log(">> Local network detected. Deploying mocks ...")
    log(`Decimals: ${DECIMALS}`)
    log(`Decimals: ${INITIAL_PRICE}`)
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: false,
      args: [DECIMALS, INITIAL_PRICE],
    })
    log(">> Mocks deployed.")
    log(
      "_______________________________________________________________________"
    )
  }
}

module.exports.tags = ["all", "mocks"] // yarn will only deploy scripts that have a special tag: $ yarn hardhat deploy --tags mocks
