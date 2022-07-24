// import

// # Aternative 1
// async function deployFunc(hre) {
//     console.log("hi")
// }
// module.exports.default = deployFunc

// # Aternative 2
// module.exports.default = async (hre) => {
//   const { getNamedAccounts, deployments } = hre // Pull these variables from hre
// }

// # Aternative 3
const { getNamedAccounts, deployments, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
  // Like in above commented alternatives. Retrieves getNamedAccounts, deployments from hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  // Use mock when using local network
  let ethUsdPriceFeedAddress
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator") // Retrieves latest MockV3 deployement
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  log("----------------------------------------------------")
  log("Deploying FundMe and waiting for confirmations...")
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log(`FundMe deployed at ${fundMe.address}`)

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress])
    // Last dployment on Rinkeby
    // Contract address: 0xE6a1ef20Cb859bE30E191b295668C97B8d677C34,
    // ethUsdPriceFeedAddress : 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
    // Error: "Error in plugin @nomiclabs/hardhat-etherscan: Invalid API Key"
    // It seems Etherscan API is not working based on latest comments?: https://github.com/NomicFoundation/hardhat/issues/2247
  }
}

module.exports.tags = ["all", "fundme"]
