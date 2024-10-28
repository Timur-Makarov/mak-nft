import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  defaultNetwork: 'localhost',
  networks: {
    sepolia: {
      url: 'https://sepolia.infura.io/v3/c8bd64b49111418bae05969e73c0f285',
      accounts: ['1f32b27d83b1ced74f9b24bbdccd71613303d98e42bce436c50daaf165db6b05'],
    },
  },
  etherscan: {
    apiKey: 'G4ZP2P6UR64SFMYW7C2WW2EPWH1TR1JTYN',
  },
}

export default config
