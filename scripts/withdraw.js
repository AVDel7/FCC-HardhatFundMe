const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract("FundMe", deployer)

  console.log("Withdrawing ...")
  const tr = await fundMe.withdraw()
  await tr.wait(1)
  console.log("Withdrew funds.")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
