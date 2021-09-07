import React from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { DEFAULT_AUTHORIZED_MARKET_HOST_RINKEBY } from '../../../common/constants'
import { NEW_RESOLUTION_DATE } from '../../../common/new_resolution_dates'
import { useConnectedWeb3Context } from '../../../contexts'
import { MarketDetailsTab, MarketMakerData, Question } from '../../../util/types'
import { Button } from '../../button'
import { ButtonType } from '../../button/button_styling_types'
import { DateField, FormRow } from '../../common'

const MarketTabs = styled.div`
  display: flex;
  max-width: 100%;
  width: ${props => props.theme.mainContainer.maxWidth};
  margin-bottom: 20px;
`

const MarketTab = styled.div<{ active: boolean }>`
  font-size: 15px;
  text-align: center;
  color: ${props => (props.active ? props.theme.buttonSecondary.color : props.theme.colors.clickable)};
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  margin-right: 0px;
  background: ${props =>
    props.active ? props.theme.buttonSecondary.backgroundColor : props.theme.colors.activeListItemBackground};
  font-weight: ${props => (props.active ? `500` : `400`)};
  cursor: pointer;
  box-shadow: 0px 0px 2px 2px #fff;
`

const MarketSetOutcomeTab = styled.div`
  font-size: 16px;
  color: ${props => props.theme.colors.textColorDark};
  background: none;
  border: none;
`

interface Props {
  activeTab: string
  blocktime?: number
  callback: (param: MarketMakerData, isScalar: boolean) => void
  hasWinningOutcomes?: Maybe<boolean>
  marketMakerData: MarketMakerData
  switchMarketTab: (arg0: MarketDetailsTab) => void
  newResolution: Date
}

export const MarketNavigation = (props: Props) => {
  const { activeTab, blocktime, callback, hasWinningOutcomes, marketMakerData, newResolution, switchMarketTab } = props

  const context = useConnectedWeb3Context()

  const { isQuestionFinalized, question } = marketMakerData
  const currentTimestamp = blocktime ? blocktime : new Date().getTime()

  //Demiurge
  let resolutionTimestamp = new Date('Fri Dec 30 2999 06:00:00 GMT-0500 (Eastern Standard Time)').getTime()
  if (NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0]) {
    resolutionTimestamp = Date.parse(
      NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0],
    )
  } else {
    resolutionTimestamp = question.resolution.getTime()
  }

  //console.log('marketmakerdata', marketMakerData)

  const isOpen = resolutionTimestamp > currentTimestamp
  const isFinalizing = resolutionTimestamp < currentTimestamp && !isQuestionFinalized

  if (activeTab === MarketDetailsTab.setOutcome) {
    return (
      <MarketTabs>
        <MarketSetOutcomeTab>Set Outcome</MarketSetOutcomeTab>
      </MarketTabs>
    )
  }

  return (
    <MarketTabs>
      {(isQuestionFinalized || !isFinalizing) && (
        <MarketTab
          active={
            activeTab === MarketDetailsTab.swap ||
            activeTab === MarketDetailsTab.buy ||
            activeTab === MarketDetailsTab.sell
          }
          onClick={() => switchMarketTab(MarketDetailsTab.swap)}
        >
          {isQuestionFinalized && hasWinningOutcomes
            ? 'Claim Outcome/Protect Liquidity'
            : isQuestionFinalized && !hasWinningOutcomes
            ? 'Redeem Outcome/Protect Liquidity'
            : 'Buy/Sell Position Shares'}
        </MarketTab>
      )}
      {isFinalizing && (
        <MarketTab
          active={activeTab === MarketDetailsTab.finalize}
          onClick={() => switchMarketTab(MarketDetailsTab.finalize)}
        >
          Finalize Winning Outcomes
        </MarketTab>
      )}
      <MarketTab
        active={activeTab === MarketDetailsTab.pool && !isFinalizing}
        onClick={() => switchMarketTab(MarketDetailsTab.pool)}
      >
        Deposit/WithDraw Liquidity
      </MarketTab>
      <MarketTab
        active={activeTab === MarketDetailsTab.history}
        onClick={() => switchMarketTab(MarketDetailsTab.history)}
      >
        Market Transaction History
      </MarketTab>
    </MarketTabs>
  )
}
