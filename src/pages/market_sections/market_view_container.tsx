import React from 'react'

import { MarketView } from '../../components/market/market_profile/market_view'
import { useConnectedWeb3Context } from '../../contexts'
import { FpmmTradeDataType } from '../../hooks/graph/useGraphFpmmTransactionsFromQuestion'
import { MarketMakerData } from '../../util/types'

import { SharedPropsInterface } from './market_pool_liquidity_container'

interface Props {
  marketMakerData: MarketMakerData
  fetchGraphMarketMakerData: () => Promise<void>
  //Demiurge
  sharedProps: SharedPropsInterface
  fpmmTrade: FpmmTradeDataType[]
}

const MarketViewContainer: React.FC<Props> = (props: Props) => {
  const context = useConnectedWeb3Context()

  return <MarketView account={context.account} {...props} />
}

export { MarketViewContainer }
