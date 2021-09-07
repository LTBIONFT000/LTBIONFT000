import { useQuery } from '@apollo/react-hooks'
import { MaxUint256, Zero } from 'ethers/constants'
import { BigNumber, BigNumberish } from 'ethers/utils'
import { assertLeafType } from 'graphql'
import gql from 'graphql-tag'
import { max } from 'moment-timezone'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'

import { NEW_RESOLUTION_DATE } from '../../../common/new_resolution_dates'
import { useConnectedWeb3Context } from '../../../contexts'
import {
  FpmmTradeDataType,
  HistoryType,
  useGraphFpmmTransactionsFromQuestion,
} from '../../../hooks/graph/useGraphFpmmTransactionsFromQuestion'
import { SharedPropsInterface } from '../../../pages/market_sections/market_pool_liquidity_container'
import { bigNumberToString, getInitialCollateral } from '../../../util/tools'
import { BalanceItem, MarketDetailsTab, MarketMakerData, OutcomeTableValue, Token } from '../../../util/types'
import { TitleValue } from '../../common'
import { totalData } from '../common_sections/history/history_section/history_select'
import { ValueStates } from '../common_sections/user_transactions_tokens/transaction_details_row'

const UserDataTitleValue = styled(TitleValue)`
  flex: 0 calc(50% - 16px);

  &:nth-child(odd) {
    margin-right: 32px;
  }
  &:nth-child(-n + 2) {
    margin-bottom: 12px;
  }

  @media (max-width: ${props => props.theme.themeBreakPoints.sm}) {
    flex: 0 50%;

    margin-right: 0 !important;
    margin-bottom: 0 !important;

    &:not(:first-child) {
      margin-top: 12px;
    }
    &:nth-child(2) {
      order: 2;
    }
    &:nth-child(3) {
      order: 1;
    }
    &:nth-child(4) {
      order: 3;
    }
  }
`

const UserData = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 20px 24px;
  border-top: ${({ theme }) => theme.borders.borderLineDisabled};
  box-shadow: 0px 0px 4px 2px #fff;
  width: 100%;
  margin-bottom: 20px;
  //background-color: ${props => props.theme.colors.gold};
  justify-content: space-between;

  @media (max-width: ${props => props.theme.themeBreakPoints.sm}) {
    flex-wrap: nowrap;
    flex-direction: column;
  }
`

const UserDataItem = styled.div`
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

const UserDataItemTop = styled.div`
  color: ${props => props.theme.colors.gold};
  font-size: 16px;
  text-align: center;
  font-weight: 500;
  line-height: 16px;
  width: 100px;
  word-wrap: break-word;
`

const UserDataItemBottom = styled.div`
  color: ${props => props.theme.colors.darkGray};
  font-size: 14px;
  text-align: center;
  font-weight: 400;
  line-height: 12px;
  margin-bottom: 15px;
`

interface Props {
  collateral: Token
  //Demiurge
  symbol: string
  totalCollateralShortage: BigNumber
  totalEarnings: BigNumber
  totalPoolShares: BigNumber
  totalShareSurplus: BigNumber
  totalUnrealizedCollateral: BigNumber
  totalUnrealizedOutcomeToken: BigNumber
  totalUnrealizedPotentialFailurePnL: number
  totalUnrealizedPotentialSuccessPnL: number
  totalUserLiquidity: BigNumber
  userEarnings: BigNumber
  sharedProps: SharedPropsInterface
  marketMakerData: MarketMakerData
  totalPriceData: { date: string }[] | null
}

export let totalAdditionalDepositedOutcomeTokens = new BigNumber('0')
export let totalAdditionalWithdrawnOutcomeTokens = new BigNumber('0')
export let totalAdditionalSuccessOutcomeTokens = new BigNumber('0')
export let totalAdditionalFailureOutcomeTokens = new BigNumber('0')

export const UserPoolData: React.FC<Props> = (props: Props) => {
  const {
    marketMakerData,
    sharedProps,
    totalEarnings,
    totalPoolShares,
    totalPriceData,
    totalUnrealizedCollateral,
    totalUserLiquidity,
    userEarnings,
  } = props
  const { totalUnrealizedOutcomeToken, totalUnrealizedPotentialFailurePnL, totalUnrealizedPotentialSuccessPnL } = props
  const { address: marketMakerAddress, balances, question } = marketMakerData
  const context = useConnectedWeb3Context()
  const { library: provider, networkId } = context
  const cpk = context.cpk
  const collateral = getInitialCollateral(networkId, props.collateral)
  const LPTradingFeeEarnings = Number(userEarnings) / Number(totalUserLiquidity)

  //Demiurge
  // Hooks can only be called inside the body of a function component.
  const fragment = gql`
    fragment TransactionFields on FpmmTransaction {
      id
      user {
        id
      }
      fpmm {
        collateralToken
      }
      fpmmType
      transactionType
      collateralTokenAmount
      sharesOrPoolTokenAmount
      creationTimestamp
      transactionHash
      additionalSharesCost
    }
  `
  const withFpmmType = gql`
    query fpmmTransactions($id: ID!, $pageSize: Int, $pageIndex: Int, $fpmmType: String) {
      fpmmTransactions(
        where: { fpmm: $id, fpmmType: $fpmmType }
        first: $pageSize
        skip: $pageIndex
        orderBy: creationTimestamp
        orderDirection: desc
      ) {
        ...TransactionFields
      }
    }
    ${fragment}
  `
  const withoutFpmmType = gql`
    query fpmmTransactions($id: ID!, $pageSize: Int, $pageIndex: Int) {
      fpmmTransactions(
        where: { fpmm: $id }
        first: $pageSize
        skip: $pageIndex
        orderBy: creationTimestamp
        orderDirection: desc
      ) {
        ...TransactionFields
      }
    }
    ${fragment}
  `

  const wrangleResponse = (data: any, decimals: number) => {
    return data.map((trade: FpmmTradeDataType) => {
      return {
        id: trade.id,
        transactionType:
          trade.transactionType === 'Add'
            ? 'Deposit'
            : trade.transactionType === 'Remove'
            ? 'Withdraw'
            : trade.transactionType,
        user: {
          id: trade.user.id,
        },
        fpmmType: trade.fpmmType,
        decimals: decimals,
        collateralTokenAddress: trade.fpmm.collateralToken,
        sharesOrPoolTokenAmount: trade.sharesOrPoolTokenAmount,
        creationTimestamp: 1000 * trade.creationTimestamp,
        collateralTokenAmount: trade.collateralTokenAmount,
        transactionHash: trade.transactionHash,
        //additionalSharesCost: trade.additionalSharesCost,
      }
    })
  }
  const [fpmmTransactions, setFpmmTransactions] = useState<Maybe<FpmmTradeDataType[]>>(null)
  const { data, error, loading, refetch } = useQuery(HistoryType.All ? withoutFpmmType : withFpmmType, {
    notifyOnNetworkStatusChange: true,
    skip: false,
    variables: {
      id: marketMakerAddress,
      fpmmType: 'Liquidity',
    },
    onCompleted: ({ fpmmTransactions }: any) => {
      const internalArray = fpmmTransactions

      setFpmmTransactions(wrangleResponse(internalArray, 3))
    },
  })

  useEffect(() => {
    setFpmmTransactions(null)
  }, [marketMakerAddress, 'Liquidity'])

  if (data && data.fpmmTransactions && fpmmTransactions === null) {
    setFpmmTransactions(wrangleResponse(data.fpmmTransactions, 3))
  }

  //Step 0: Prepare PriceDateData for determining the buy/sell distribution ratio of addtional outcome tokens
  //CAUTION: const [period, setPeriod] = useState<Period>('1M') must be set carefully to have enough blocks
  const rawSuccessData =
    totalPriceData &&
    totalPriceData.map((el, i, arr) => Object.entries(arr[i]).filter(a => a.includes('Success') || a.includes('date')))
  const rawFailureData =
    totalPriceData &&
    totalPriceData.map((el, i, arr) => Object.entries(arr[i]).filter(a => a.includes('Failure') || a.includes('date')))
  const SuccessPriceDateData = rawSuccessData && rawSuccessData.map((el, i, arr) => Object.fromEntries(arr[i]))
  const FailurePriceDateData = rawFailureData && rawFailureData.map((el, i, arr) => Object.fromEntries(arr[i]))

  useEffect(() => {
    //console.log('check2', fpmmTransactions, cpk, SuccessPriceDateData, FailurePriceDateData)
    if (fpmmTransactions && cpk && SuccessPriceDateData && FailurePriceDateData) {
      //Step 1: Calculate total outcome-specific additional outcome tokens from depositing liquidity (adding all Ds);
      const totalDepositedCollateralTokens = fpmmTransactions
        .filter(item => item.fpmmType === 'Liquidity')
        .filter(item => item.transactionType === 'Deposit')
        .map(item =>
          item.user.id.toLowerCase() === cpk.address.toLowerCase()
            ? [item.collateralTokenAmount, item.user.id]
            : [Zero, item.user.id],
        )
        .reduce((a, b) => a.add(b[0]), Zero)
      const totalDepositedPoolTokens = fpmmTransactions
        .filter(item => item.fpmmType === 'Liquidity')
        .filter(item => item.transactionType === 'Deposit')
        .map(item =>
          item.user.id.toLowerCase() === cpk.address.toLowerCase()
            ? [item.sharesOrPoolTokenAmount, item.user.id]
            : [Zero, item.user.id],
        )
        .reduce((a, b) => a.add(b[0]), Zero)
      totalAdditionalDepositedOutcomeTokens = totalDepositedPoolTokens.sub(totalDepositedCollateralTokens)

      const DepositSpecificAdditionalOutcomeTokens = fpmmTransactions
        .filter(item => item.fpmmType === 'Liquidity')
        .filter(item => item.transactionType === 'Deposit')
        .map(item =>
          item.user.id.toLowerCase() === cpk.address.toLowerCase()
            ? [item.collateralTokenAmount, item.sharesOrPoolTokenAmount, new BigNumber(item.creationTimestamp)]
            : [Zero, Zero, Zero],
        )
        .filter(item => !item[2].eq(Zero))
        .map(item => [new BigNumber(item[0]).sub(new BigNumber(item[1])).abs(), item[2]])
      //console.log('DepositSpecificAdditionalOutcomeTokens', DepositSpecificAdditionalOutcomeTokens)

      for (let i = 0; i < DepositSpecificAdditionalOutcomeTokens.length; i++) {
        //CAUTION: 1H Precision for matching the timestamp of the prices and the timestamp of liquidity
        const matchingDepositTimeSuccessOutcome = SuccessPriceDateData.map(item =>
          new Date(Object.values(item)[1]).getTime(),
        )
          .filter(item => item - Number(DepositSpecificAdditionalOutcomeTokens[i][1]) <= 0)
          .reduce((a, b) => Math.max(a, b), 0)

        const matchingDepositTimeFailureOutcome = FailurePriceDateData.map(item =>
          new Date(Object.values(item)[1]).getTime(),
        )
          .filter(item => item - Number(DepositSpecificAdditionalOutcomeTokens[i][1]) <= 0)
          .reduce((a, b) => Math.max(a, b), 0)

        console.log(i, 'th S,F', matchingDepositTimeSuccessOutcome, matchingDepositTimeFailureOutcome)
        const matchingDepositTimeSuccessOutcomePrice =
          matchingDepositTimeSuccessOutcome &&
          Number(
            SuccessPriceDateData.filter(
              item => new Date(Object.values(item)[1]).getTime() === matchingDepositTimeSuccessOutcome,
            )[0].Success,
          )
        const matchingDepositTimeFailureOutcomePrice =
          matchingDepositTimeFailureOutcome &&
          Number(
            FailurePriceDateData.filter(
              item => new Date(Object.values(item)[1]).getTime() === matchingDepositTimeFailureOutcome,
            )[0].Failure,
          )
        //console.log(i,'th successPrice,failurePrice',matchingDepositTimeSuccessOutcomePrice,matchingDepositTimeFailureOutcomePrice,)
        totalAdditionalSuccessOutcomeTokens =
          matchingDepositTimeSuccessOutcomePrice === matchingDepositTimeFailureOutcomePrice
            ? totalAdditionalSuccessOutcomeTokens.add(DepositSpecificAdditionalOutcomeTokens[i][0].div(2))
            : matchingDepositTimeSuccessOutcomePrice > matchingDepositTimeFailureOutcomePrice
            ? totalAdditionalSuccessOutcomeTokens.add(DepositSpecificAdditionalOutcomeTokens[i][0])
            : totalAdditionalSuccessOutcomeTokens.add(Zero)
        totalAdditionalFailureOutcomeTokens =
          matchingDepositTimeSuccessOutcomePrice === matchingDepositTimeFailureOutcomePrice
            ? totalAdditionalFailureOutcomeTokens.add(DepositSpecificAdditionalOutcomeTokens[i][0].div(2))
            : matchingDepositTimeSuccessOutcomePrice < matchingDepositTimeFailureOutcomePrice
            ? totalAdditionalFailureOutcomeTokens.add(DepositSpecificAdditionalOutcomeTokens[i][0])
            : totalAdditionalFailureOutcomeTokens.add(Zero)
        totalAdditionalWithdrawnOutcomeTokens = totalAdditionalWithdrawnOutcomeTokens.add(
          DepositSpecificAdditionalOutcomeTokens[i][0],
        )
        //console.log(i,'th successToken, failureToken',totalAdditionalSuccessOutcomeTokens.toString(),totalAdditionalFailureOutcomeTokens.toString(),)
        //console.log(i, 'th matchingAdditionalOutcomeTokens', matchingAdditionalOutcomeTokens.toString())
        //console.log(i, 'th totalAdditionalWithdrawnOutcomeTokens', totalAdditionalWithdrawnOutcomeTokens.toString())
      }

      //Step 2a Calculate deposit-specific K
      const depositSpecificAdditionalKvalues = fpmmTransactions
        .filter(item => item.fpmmType === 'Liquidity')
        .filter(item => item.transactionType === 'Deposit')
        .map(item =>
          item.user.id.toLowerCase() === cpk.address.toLowerCase()
            ? [item.collateralTokenAmount, item.sharesOrPoolTokenAmount, new BigNumber(item.creationTimestamp)]
            : [Zero, Zero, Zero],
        )
        .map(item => [
          new BigNumber(item[0])
            .sub(new BigNumber(item[1]))
            .mul(new BigNumber(item[0]))
            .abs(),
          item[2],
        ])
      //Step 2b Calculate withdraw-specific matching K value
      const withdrawSpecificCollateralTokens = fpmmTransactions
        .filter(item => item.fpmmType === 'Liquidity')
        .filter(item => item.transactionType === 'Withdraw')
        .map(item =>
          item.user.id.toLowerCase() === cpk.address.toLowerCase()
            ? [item.collateralTokenAmount, new BigNumber(item.creationTimestamp)]
            : [Zero, Zero],
        )
      for (let i = 0; i < withdrawSpecificCollateralTokens.length; i++) {
        const matchingTimestamp = depositSpecificAdditionalKvalues
          .filter(item => item[1].sub(withdrawSpecificCollateralTokens[i][1]) <= Zero)
          .map(item => item[1])
          .reduce((a, b) => new BigNumber(Math.max(Number(a), Number(b))), Zero)
        //console.log(i, 'th withdrawSpecificCollateralTokens', withdrawSpecificCollateralTokens[i][0].toString())
        //console.log(i, 'th matchingTimestamp', matchingTimestamp.toString())
        const matchingKValue = depositSpecificAdditionalKvalues.filter(item => item[1].eq(matchingTimestamp))[0][0]
        //console.log(i, 'th matchingKValue', matchingKValue.toString())
        const matchingAdditionalOutcomeTokens = matchingKValue
          .div(withdrawSpecificCollateralTokens[i][0])
          .mul(-1)
          .add(withdrawSpecificCollateralTokens[i][0])
          .abs()

        //CAUTION: 1H Precision for matching the timestamp of the prices and the timestamp of liquidity
        const matchingWithdrawTimeSuccessOutcome = SuccessPriceDateData.map(item =>
          new Date(Object.values(item)[1]).getTime(),
        )
          .filter(item => item - Number(matchingTimestamp) <= 0)
          .reduce((a, b) => Math.max(a, b), 0)
        const matchingWithdrawTimeSuccessOutcomePrice =
          matchingWithdrawTimeSuccessOutcome &&
          Number(
            SuccessPriceDateData.filter(
              item => new Date(Object.values(item)[1]).getTime() === matchingWithdrawTimeSuccessOutcome,
            )[0].Success,
          )

        const matchingWithdrawTimeFailureOutcome = FailurePriceDateData.map(item =>
          new Date(Object.values(item)[1]).getTime(),
        )
          .filter(item => item - Number(matchingTimestamp) <= 0)
          .reduce((a, b) => Math.max(a, b), 0)
        const matchingWithdrawTimeFailureOutcomePrice =
          matchingWithdrawTimeFailureOutcome &&
          Number(
            FailurePriceDateData.filter(
              item => new Date(Object.values(item)[1]).getTime() === matchingWithdrawTimeFailureOutcome,
            )[0].Failure,
          )

        //Step 2c: Calculate total and outcome-specific additional outcome tokens from withdrawing liquidity (adding all Cs);
        //console.log(i, 'th successPrice, failurePrice', matchingWithdrawTimeSuccessOutcomePrice, matchingWithdrawTimeFailureOutcomePrice,)
        totalAdditionalSuccessOutcomeTokens =
          matchingWithdrawTimeSuccessOutcomePrice === matchingWithdrawTimeFailureOutcomePrice
            ? totalAdditionalSuccessOutcomeTokens.add(matchingAdditionalOutcomeTokens.div(2))
            : matchingWithdrawTimeSuccessOutcomePrice > matchingWithdrawTimeFailureOutcomePrice
            ? totalAdditionalSuccessOutcomeTokens.add(matchingAdditionalOutcomeTokens)
            : totalAdditionalSuccessOutcomeTokens.add(Zero)
        totalAdditionalFailureOutcomeTokens =
          matchingWithdrawTimeSuccessOutcomePrice === matchingWithdrawTimeFailureOutcomePrice
            ? totalAdditionalFailureOutcomeTokens.add(matchingAdditionalOutcomeTokens.div(2))
            : matchingWithdrawTimeSuccessOutcomePrice < matchingWithdrawTimeFailureOutcomePrice
            ? totalAdditionalFailureOutcomeTokens.add(matchingAdditionalOutcomeTokens)
            : totalAdditionalFailureOutcomeTokens.add(Zero)
        totalAdditionalWithdrawnOutcomeTokens = totalAdditionalWithdrawnOutcomeTokens.add(
          matchingAdditionalOutcomeTokens,
        )
      }
    }
  }, [SuccessPriceDateData?.length])

  return (
    <UserData>
      <UserDataItem>
        <UserDataItemTop>
          <UserDataItemBottom>Your Unrealized PnL (If Success)</UserDataItemBottom>
          {`${(totalUnrealizedPotentialSuccessPnL * 100).toFixed(2)}%`}
        </UserDataItemTop>
      </UserDataItem>
      <UserDataItem>
        <UserDataItemTop>
          <UserDataItemBottom>Your Unrealized PnL (If Failure)</UserDataItemBottom>
          {`${(totalUnrealizedPotentialFailurePnL * 100).toFixed(2)}%`}
        </UserDataItemTop>
      </UserDataItem>
      <UserDataItem>
        <UserDataItemTop>
          <UserDataItemBottom>
            <div> Your Total </div>
            <div> LP Deposits </div>
          </UserDataItemBottom>
          {`${(Number(totalUserLiquidity) / 1e18).toFixed(2)} ${collateral.symbol}`}
        </UserDataItemTop>
      </UserDataItem>
      <UserDataItem>
        <UserDataItemTop>
          <UserDataItemBottom>Your Unrealized LP Earnings</UserDataItemBottom>
          {`${(LPTradingFeeEarnings * 100).toFixed(2)}%`}
        </UserDataItemTop>
      </UserDataItem>
    </UserData>
  )
}
