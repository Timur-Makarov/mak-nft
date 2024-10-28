import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import dotenv from 'dotenv'

dotenv.config()

const VRF_COORDINATOR = process.env.VRF_COORDINATOR
const VRF_SUB_ID = process.env.VRF_SUB_ID
const MSC_ADDRESS = process.env.MSC_ADDRESS
const BASE_URI = process.env.BASE_URI

const MakNFTModule = buildModule('MakNFTModule', (m) => {
  const makNFT = m.contract('MakNFT', [VRF_COORDINATOR, VRF_SUB_ID, MSC_ADDRESS, BASE_URI])

  return { makNFT }
})

export default MakNFTModule
