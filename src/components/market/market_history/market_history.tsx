import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import { SharedPropsInterface } from '../../../pages/market_sections/market_pool_liquidity_container'
import { MarketMakerData } from '../../../util/types'
import { HistorySelectContainer } from '../common_sections/history/history_section'

interface Props extends RouteComponentProps<any> {
  marketMakerData: MarketMakerData
  sharedProps: SharedPropsInterface
}

const MarketHistoryWrapper: React.FC<Props> = (props: Props) => {
  const { marketMakerData, sharedProps } = props
  const {
    address: marketMakerAddress,
    answerFinalizedTimestamp,
    collateral,
    fee,
    oracle,
    question,
    scalarHigh,
    scalarLow,
  } = marketMakerData

  return (
    <>
      <HistorySelectContainer
        answerFinalizedTimestamp={answerFinalizedTimestamp}
        currency={collateral.symbol}
        decimals={collateral.decimals}
        fee={fee}
        hidden={false}
        marketMakerAddress={marketMakerAddress}
        marketMakerData={marketMakerData}
        oracle={oracle}
        outcomes={question.outcomes}
        scalarHigh={scalarHigh}
        scalarLow={scalarLow}
        sharedProps={sharedProps}
        unit={question.title && question.title.includes('[') ? question.title.split('[')[1].split(']')[0] : ''}
      />
    </>
  )
}

export const MarketHistory = withRouter(MarketHistoryWrapper)
