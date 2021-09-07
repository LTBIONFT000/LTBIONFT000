import { Contract, Wallet, ethers, utils } from 'ethers'
import { TransactionReceipt } from 'ethers/providers'
import { BigNumber } from 'ethers/utils'

import { STANDARD_DECIMALS } from '../common/constants'
import { getLogger } from '../util/logger'
import { isAddress, isContract } from '../util/tools'
import { Token } from '../util/types'

const logger = getLogger('Services::LiquidityProtection')
//ATTN: remove the payable
const dtLPSDAbi = ['function payoutDAI(address demander, uint256 amount) public returns(bool)']

class LiquidityProtectionService {
  contract: Contract
  provider: any

  constructor(address: string, provider: any) {
    this.contract = new ethers.Contract(address, dtLPSDAbi, provider)
    this.provider = provider
  }

  get address(): string {
    return this.contract.address
  }

  getPayout = async (to: string, amount: BigNumber): Promise<string[]> => {
    return this.contract.payoutDAI(to, amount)
  }

  static encodePayout = (to: string, amount: BigNumber): string => {
    const payoutInterface = new utils.Interface(dtLPSDAbi)

    return payoutInterface.functions.payoutDAI.encode([to, amount])
  }
}

export { LiquidityProtectionService }
