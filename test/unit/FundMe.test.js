const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { solidity } = require("ethereum-waffle")
const chai = require("chai")
chai.use(solidity) // Had to add this for .to.be.reverted to work -> https://github.com/TrueFiEng/Waffle/issues/95
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) // Ensure we're not on a development chain
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      let mockV3Aggregator
      const sendValue = ethers.utils.parseEther("1") // 1 eth to 1e18

      beforeEach(async function () {
        //const accounts = await ethers.getSigners()
        //const account_0 = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"]) // Deploy contracts based on tags.
        fundMe = await ethers.getContract("FundMe", deployer) // Get most recently deployed FundMe contract
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function () {
        it("sets the aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })

        describe("fund", async function () {
          it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
              "You need to spend more ETH!"
            )
          })

          it("Updates the amount funded datastructure", async function () {
            const r1 = await fundMe.fund({ value: sendValue }) // Sending amount with deployers' address
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
          })

          it("Adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFunders(0)
            assert.equal(funder, deployer)
          })
        })
      })

      describe("withraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single funder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // Assert
          assert.equal(endingFundMeBalance, 0) // All money left
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance.toString()), // these variables are of type BigNumber
            endingDeployerBalance.add(gasCost).toString() // Account for gas used
          )
        })

        it("Withdraw ETH with multiple funders", async function () {
          // Arrange
          const accounts = await ethers.getSigners()

          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]) // Before this the contract is connected to the deployer's account.
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Assert
          assert.equal(endingFundMeBalance, 0) // All money left
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance.toString()), // these variables are of type BigNumber
            endingDeployerBalance.add(gasCost).toString() // Account for gas used
          )

          // Make sure the funders array are reset properly
          await expect(fundMe.getFunders(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })

        // Cheaper withdraw
        it("Withdraw ETH from a single funder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // Assert
          assert.equal(endingFundMeBalance, 0) // All money left
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance.toString()), // these variables are of type BigNumber
            endingDeployerBalance.add(gasCost).toString() // Account for gas used
          )
        })

        it("Cheaper withdraw ETH with multiple funders", async function () {
          // Arrange
          const accounts = await ethers.getSigners()

          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]) // Before this the contract is connected to the deployer's account.
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // Assert
          assert.equal(endingFundMeBalance, 0) // All money left
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance.toString()), // these variables are of type BigNumber
            endingDeployerBalance.add(gasCost).toString() // Account for gas used
          )

          // Make sure the funders array are reset properly
          await expect(fundMe.getFunders(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
