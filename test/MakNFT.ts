import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { ERC20Mock, VRFCoordinatorV2_5Mock } from '../typechain-types'

const BASE_URI = 'ipfs://QmWimZ8W7npxqQFFu5PP1nG4LPL2u5AQ8dQLfDWjSif5ty'

let vrf: VRFCoordinatorV2_5Mock
let msc: ERC20Mock

const subId = '1'

before(async () => {
  const VRFmockFactory = await hre.ethers.getContractFactory('VRFCoordinatorV2_5Mock')
  vrf = await VRFmockFactory.deploy('0', '0', '0')
  await vrf.createSubscription()
  const erc20MockFactory = await hre.ethers.getContractFactory('ERC20Mock')
  msc = await erc20MockFactory.deploy()
})

describe('MakNFT', function () {
  async function defaultFixture() {
    const owner = hre.ethers.Wallet.createRandom()

    const makNFTFactory = await hre.ethers.getContractFactory('MakNFT')
    const makNFT = await makNFTFactory.deploy(vrf.getAddress(), subId, msc.getAddress(), BASE_URI)

    await msc.mint(owner.getAddress(), '5000000000000000000')
    await msc.connect(owner).approve(makNFT.getAddress(), '5000000000000000000')
    await vrf.addConsumer(subId, makNFT.getAddress())

    return { makNFT, owner }
  }

  describe('Getters', function () {
    it('Should get rarity by random number', async function () {
      const { makNFT } = await loadFixture(defaultFixture)
      // 1 to 10 = Legendary
      const rarity = await makNFT.getRarity(1)
      // 2 - Legendary
      expect(rarity).to.equal(2)
    })
  })

  describe('NFT', function () {
    it('Should revert MSC balance insufficiency', async function () {
      const { makNFT } = await loadFixture(defaultFixture)
      // Default account does not have MSC
      expect(await makNFT.requestNFT()).to.be.revertedWith('MakNFT: Insufficient MSC balance')
    })

    it('Should request NFT correctly', async function () {
      const { makNFT, owner } = await loadFixture(defaultFixture)
      const tx = await makNFT.connect(owner).requestNFT()
      const rec = await tx.wait()

      expect(rec.status).to.be.equal(1)
      expect(await msc.balanceOf(makNFT.getAddress())).to.equal('1000000000000000000')
      expect(await msc.balanceOf(owner.getAddress())).to.equal('4000000000000000000')
    })

    it('Should request and mint NFT correctly', async function () {
      const { makNFT, owner } = await loadFixture(defaultFixture)
      await makNFT.connect(owner).requestNFT()
      await vrf.fulfillRandomWords('1', makNFT.getAddress())
      const supply = await makNFT.getTotalSupply()
      expect(supply).to.equal(1)
    })
  })
})
