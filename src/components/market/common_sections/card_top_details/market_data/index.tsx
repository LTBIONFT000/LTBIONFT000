import { BigNumber } from 'ethers/utils'
import moment from 'moment'
import momentTZ from 'moment-timezone'
import React, { DOMAttributes, useEffect, useState } from 'react'
import styled from 'styled-components'

import { NEW_RESOLUTION_DATE } from '../../../../../common/new_resolution_dates'
import { useConnectedWeb3Context } from '../../../../../contexts'
import { useTokens } from '../../../../../hooks'
import { bigNumberToNumber, formatDate, formatToShortNumber } from '../../../../../util/tools'
import { MarketMakerData, Token } from '../../../../../util/types'
import { TextToggle } from '../../message_text/TextToggle'

const MarketDataWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 1px;
  box-shadow: 0px 0px 4px 2px #fff;
  padding: 10px 20px;

  & > * + * {
    margin-left: 35px;
  }

  @media (max-width: ${props => props.theme.themeBreakPoints.md}) {
    flex-direction: column;
    margin-bottom: 13px;
    & > * + * {
      margin-top: 20px;
      margin-left: 0px;
    }
  }
`

const MarketDataItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 45px;
  margin-bottom: 12px;

  @media (max-width: ${props => props.theme.themeBreakPoints.md}) {
    width: 100%;
    flex-direction: row-reverse;
    height: 16px;
  }
`

const MarketDataItemTop = styled.div`
  color: ${props => props.theme.colors.textColorDarker};
  font-size: 16px;
  text-align: center;
  font-weight: 500;
  line-height: 16px;
  width: 100px;
  word-wrap: break-word;
`

const MarketDataItemBottom = styled.div`
  color: ${props => props.theme.colors.darkGray};
  font-size: 14px;
  text-align: center;
  font-weight: 400;
  line-height: 12px;
  margin-bottom: 15px;
`

const MarketDataItemImage = styled.img`
  max-height: 18px;
  max-width: 18px;
  margin-right: 10px;
`

interface Props extends DOMAttributes<HTMLDivElement> {
  collateralVolume: BigNumber
  blocktime?: number
  liquidity: string
  resolutionTimestamp: Date
  runningDailyVolumeByHour: BigNumber[]
  lastActiveDay: number
  currency: Token
  isFinalize?: boolean
  answerFinalizedTimestamp?: Maybe<BigNumber>
  marketMakerData: MarketMakerData
}

export const MarketData: React.FC<Props> = props => {
  const {
    answerFinalizedTimestamp,
    blocktime,
    collateralVolume,
    currency,
    isFinalize = false,
    lastActiveDay,
    liquidity,
    marketMakerData,
    resolutionTimestamp,
    runningDailyVolumeByHour,
  } = props

  const { question } = marketMakerData
  const context = useConnectedWeb3Context()
  const { tokens } = useTokens(context)
  const [currencyIcon, setCurrencyIcon] = useState<string | undefined>('')
  const [showUTC, setShowUTC] = useState<boolean>(true)
  const [show24H, setShow24H] = useState<boolean>(false)

  useEffect(() => {
    const matchingAddress = (token: Token) => token.address.toLowerCase() === currency.address.toLowerCase()
    const tokenIndex = tokens.findIndex(matchingAddress)
    tokenIndex !== -1 && setCurrencyIcon(tokens[tokenIndex].image)
  }, [tokens, currency.address])

  const timezoneAbbr = momentTZ.tz(momentTZ.tz.guess()).zoneAbbr()

  const dailyVolumeValue =
    Math.floor(Date.now() / 86400000) === lastActiveDay && runningDailyVolumeByHour && currency.decimals
      ? runningDailyVolumeByHour[Math.floor(Date.now() / (1000 * 60 * 60)) % 24]
      : new BigNumber('0')

  const dailyVolume = bigNumberToNumber(dailyVolumeValue, currency.decimals)
  const totalVolume = bigNumberToNumber(collateralVolume, currency.decimals)

  //Demiurge
  let resolutionDate = new Date('Fri Dec 30 2999 06:00:00 GMT-0500 (Eastern Standard Time)')
  if (NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0]) {
    resolutionDate = new Date(
      NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0],
    )
    //console.log('compare yes', resolutionDate)
  } else {
    resolutionDate = new Date(question.resolution)
    //console.log('compare no', resolutionDate, resolutionTimestamp)
  }

  return (
    <MarketDataWrapper>
      <MarketDataItem>
        <MarketDataItemTop>
          <MarketDataItemBottom>Total Liquiity</MarketDataItemBottom>
          {liquidity}
          <div>{currency.symbol}</div>
        </MarketDataItemTop>
      </MarketDataItem>
      <MarketDataItem>
        <MarketDataItemTop>
          <MarketDataItemBottom>Total Volume</MarketDataItemBottom>
          {formatToShortNumber(totalVolume)}
          <div>{currency.symbol}</div>
        </MarketDataItemTop>
      </MarketDataItem>
      <MarketDataItem>
        <MarketDataItemTop>
          <MarketDataItemBottom>Last Trade</MarketDataItemBottom>
          {moment(resolutionDate).format('YYYY-MM-DD H:mm zz')}&nbsp;{`${timezoneAbbr}`}
        </MarketDataItemTop>
      </MarketDataItem>
      {isFinalize && answerFinalizedTimestamp && (
        <MarketDataItem>
          <MarketDataItemTop>
            <MarketDataItemBottom>Finalized</MarketDataItemBottom>
            In {moment(answerFinalizedTimestamp.toNumber() * 1000).fromNow(true)}
          </MarketDataItemTop>
        </MarketDataItem>
      )}
      {!isFinalize && blocktime && blocktime < resolutionDate.getTime() && (
        <MarketDataItem>
          <MarketDataItemTop>
            <MarketDataItemBottom>Market Time </MarketDataItemBottom>
            {moment(resolutionDate).from(new Date(blocktime), true)}
            <div>Remaining</div>
          </MarketDataItemTop>
        </MarketDataItem>
      )}
    </MarketDataWrapper>
  )
}
