import moment from 'moment'
import React, { HTMLAttributes, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { STANDARD_DECIMALS } from '../../../../../common/constants'
import { NEW_RESOLUTION_DATE } from '../../../../../common/new_resolution_dates'
import { useConnectedWeb3Context } from '../../../../../contexts'
import { useSymbol } from '../../../../../hooks'
import { ERC20Service } from '../../../../../services'
import { getLogger } from '../../../../../util/logger'
import { getTokenFromAddress } from '../../../../../util/networks'
import {
  bigNumberToNumber,
  calcPrediction,
  calcPrice,
  formatNumber,
  formatToShortNumber,
  getScalarTitle,
  getUnit,
  isScalarMarket,
} from '../../../../../util/tools'
import { MarketMakerDataItem, Token } from '../../../../../util/types'
import { IconStar } from '../../../../common/icons/IconStar'

//Demiurge
const Wrapper = styled(NavLink)`
  border-bottom: 1px solid ${props => props.theme.borders.borderColor};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 22px 25px;
  text-decoration: none;

  &:active,
  &:hover {
    background-color: ${props => props.theme.colors.activeListItemBackground};
    box-shadow: 0px 0px 4px 2px #fff;
  }

  &:last-child {
    border-bottom: none;
  }
`

const Title = styled.h2`
  color: ${props => props.theme.colors.textColorDarker};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0 0 10px 0;
`

const Info = styled.div`
  font-family: 'Do Hyeon';
  align-items: center;
  color: ${props => props.theme.colors.textColorLighter};
  display: flex;
  flex-wrap: wrap;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
`

const Outcome = styled.span`
  color: ${props => props.theme.colors.gold};
  margin-left: 8px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
`
//Demiurge
const Deadline = styled.span`
  color: ${props => props.theme.colors.greenLight};
  margin-left: 8px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
`

const Separator = styled.span`
  font-size: 18px;
  margin: 0 8px;
  color: ${props => props.theme.colors.verticalDivider};
`

interface Props extends HTMLAttributes<HTMLDivElement> {
  market: MarketMakerDataItem
  currentFilter: any
}

const logger = getLogger('Market::ListItem')

export const ListItem: React.FC<Props> = (props: Props) => {
  const context = useConnectedWeb3Context()
  const { account, library: provider } = context

  const { currentFilter, market } = props
  const {
    address,
    collateralToken,
    collateralVolume,
    creationTimestamp,
    lastActiveDay,
    openingTimestamp,
    oracle,
    outcomeTokenAmounts,
    outcomeTokenMarginalPrices,
    outcomes,
    runningDailyVolumeByHour,
    scalarHigh,
    scalarLow,
    title,
    totalPoolShares,
  } = market

  let token: Token | undefined
  try {
    const tokenInfo = getTokenFromAddress(context.networkId, collateralToken)
    const volume = bigNumberToNumber(collateralVolume, tokenInfo.decimals)

    token = { ...tokenInfo, volume }
  } catch (err) {
    logger.debug(err.message)
  }

  const [details, setDetails] = useState(token || { decimals: STANDARD_DECIMALS, symbol: '', volume: 0 })

  const { decimals, volume } = details
  const symbol = useSymbol(details as Token)
  const now = moment()
  //Demiurge
  let endDate = new Date('Fri Dec 30 2999 06:00:00 GMT-0500 (Eastern Standard Time)')
  if (NEW_RESOLUTION_DATE.filter(item => item.question_title === title).map(item => item.new_date)[0]) {
    endDate = new Date(NEW_RESOLUTION_DATE.filter(item => item.question_title === title).map(item => item.new_date)[0])
    //console.log('compare yes', resolutionDate)
  } else {
    endDate = openingTimestamp
    //console.log('compare no', resolutionDate, resolutionTimestamp)
  }

  const endsText = moment(endDate).fromNow(true)
  const resolutionDate = moment(endDate).format('MMM Do, YYYY')

  const creationDate = new Date(1000 * parseInt(creationTimestamp))
  const formattedCreationDate = moment(creationDate).format('MMM Do, YYYY')

  const formattedLiquidity: string = formatToShortNumber(bigNumberToNumber(totalPoolShares, details.decimals))

  useEffect(() => {
    const setToken = async () => {
      if (!token) {
        // fallback to token service if unknown token
        const erc20Service = new ERC20Service(provider, account, collateralToken)
        const { decimals, symbol } = await erc20Service.getProfileSummary()
        const volume = bigNumberToNumber(collateralVolume, decimals)

        setDetails({ symbol, decimals, volume })
      }
    }

    setToken()
  }, [account, collateralToken, collateralVolume, provider, context.networkId, token])

  const percentages = calcPrice(outcomeTokenAmounts)
  const indexMax = percentages.indexOf(Math.max(...percentages))

  const isScalar = isScalarMarket(oracle || '', context.networkId || 0)

  let currentPrediction
  let unit
  let scalarTitle

  if (isScalar) {
    unit = getUnit(title)
    scalarTitle = getScalarTitle(title)

    if (outcomeTokenMarginalPrices && scalarLow && scalarHigh) {
      currentPrediction = calcPrediction(outcomeTokenMarginalPrices[1], scalarLow, scalarHigh)
    }
  }

  return (
    <Wrapper to={`/${address}`}>
      <Title>{isScalar ? scalarTitle : title}</Title>
      <Info>
        <IconStar></IconStar>
        <Outcome>
          {isScalar
            ? `${currentPrediction ? formatNumber(currentPrediction.toString()) : 'Unknown'} ${unit}`
            : outcomes && `${(percentages[indexMax] * 100).toFixed(2)}% participants bet: ${outcomes[indexMax]}`}
        </Outcome>
        <Separator>|</Separator>
        <Deadline>
          {moment(endDate).isAfter(now) ? `Market OPEN for another ${endsText}` : `Market CLOSED ${endsText} ago`}
        </Deadline>
      </Info>
    </Wrapper>
  )
}
