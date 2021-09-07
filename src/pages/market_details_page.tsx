import React from 'react'

import { MarketViewContainer } from '../components'
import { FpmmTradeDataType } from '../hooks/graph/useGraphFpmmTransactionsFromQuestion'
import { MarketMakerData } from '../util/types'

import { SharedPropsInterface } from './market_sections/market_pool_liquidity_container'

type Props = {
  fetchGraphMarketMakerData: () => Promise<void>
  marketMakerData: MarketMakerData
  //Demiurge
  sharedProps: SharedPropsInterface
  fpmmTrade: FpmmTradeDataType[]
}

const MarketDetailsPage: React.FC<Props> = props => {
  return <MarketViewContainer {...props} />
}

export { MarketDetailsPage }
