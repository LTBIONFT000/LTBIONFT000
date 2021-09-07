import React from 'react'

import { MarketHistory } from '../../components/market/market_history/market_history'
import { MarketMakerData } from '../../util/types'

import { SharedPropsInterface } from './market_pool_liquidity_container'

interface Props {
  marketMakerData: MarketMakerData
  sharedProps: SharedPropsInterface
}

const MarketHistoryContainer: React.FC<Props> = (props: Props) => {
  const { marketMakerData, sharedProps } = props

  return <MarketHistory marketMakerData={marketMakerData} sharedProps={sharedProps} />
}

export { MarketHistoryContainer }
