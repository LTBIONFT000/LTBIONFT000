import { useInterval } from '@react-corekit/use-interval'
import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router'

import { FETCH_DETAILS_INTERVAL } from '../../../common/constants'
import { useConnectedWeb3Context } from '../../../contexts'
import { useCheckContractExists, useMarketMakerData } from '../../../hooks'
import { FpmmTradeDataType } from '../../../hooks/graph/useGraphFpmmTransactionsFromQuestion'
import { MarketDetailsPage } from '../../../pages'
import {
  MarketPoolLiquidityContainer,
  SharedPropsInterface,
} from '../../../pages/market_sections/market_pool_liquidity_container'
import { getLogger } from '../../../util/logger'
import { isAddress } from '../../../util/tools'
import { ThreeBoxComments } from '../../comments'
import { InlineLoading } from '../../loading'
import { MarketNotFound } from '../../market/market_not_found'

const logger = getLogger('Market::Routes')

interface RouteParams {
  address: string
}

interface Props {
  marketMakerAddress: string
  //Demiurge
  sharedProps: SharedPropsInterface
  fpmmTrade: FpmmTradeDataType[]
}

const MarketValidation: React.FC<Props> = (props: Props) => {
  const context = useConnectedWeb3Context()

  const { marketMakerAddress } = props

  // Validate contract REALLY exists
  const contractExists = useCheckContractExists(marketMakerAddress, context)
  const { fetchData, fetchGraphMarketMakerData, marketMakerData } = useMarketMakerData(marketMakerAddress.toLowerCase())
  useInterval(fetchData, FETCH_DETAILS_INTERVAL)
  if (!contractExists) {
    logger.log(`Market address not found`)
    return <MarketNotFound />
  }

  if (!marketMakerData) {
    return <InlineLoading />
  }

  return (
    <>
      <MarketDetailsPage
        {...props}
        fetchGraphMarketMakerData={fetchGraphMarketMakerData}
        marketMakerData={marketMakerData}
      />
      <ThreeBoxComments threadName={marketMakerData.question.id} />
    </>
  )
}

const MarketRoutes = (props: RouteComponentProps<RouteParams>) => {
  const marketMakerAddress = props.match.params.address
  if (!isAddress(marketMakerAddress)) {
    logger.log(`Contract address not valid`)
    return <Redirect to="/" />
  }
  //Demiurge
  const sharedProps = {} as SharedPropsInterface
  const fpmmTrade = {} as FpmmTradeDataType[]
  return <MarketValidation fpmmTrade={fpmmTrade} marketMakerAddress={marketMakerAddress} sharedProps={sharedProps} />
}

export { MarketRoutes }
