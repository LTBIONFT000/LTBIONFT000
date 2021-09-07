import { useQuery } from '@apollo/react-hooks'
import Big from 'big.js'
import { MaxUint256, Zero } from 'ethers/constants'
import { BigNumber, Interface, bigNumberify, id } from 'ethers/utils'
import gql from 'graphql-tag'
import React, { useEffect, useMemo, useState } from 'react'
import { RouteComponentProps, useHistory, useLocation, withRouter } from 'react-router-dom'
import styled from 'styled-components'
import { servicesVersion } from 'typescript'

import { STANDARD_DECIMALS } from '../../../../common/constants'
import { NEW_RESOLUTION_DATE } from '../../../../common/new_resolution_dates'
import { WhenConnected, useConnectedWeb3Context } from '../../../../contexts'
import { useContracts, useGraphMarketUserTxData, useSymbol } from '../../../../hooks'
import {
  FpmmTradeDataType,
  HistoryType,
  useGraphFpmmTransactionsFromQuestion,
} from '../../../../hooks/graph/useGraphFpmmTransactionsFromQuestion'
import { MarketBuyContainer } from '../../../../pages/market_sections/market_buy_container'
import { MarketHistoryContainer } from '../../../../pages/market_sections/market_history_container'
import {
  MarketPoolLiquidityContainer,
  SharedPropsInterface,
} from '../../../../pages/market_sections/market_pool_liquidity_container'
import { MarketSellContainer } from '../../../../pages/market_sections/market_sell_container'
import { CPKService, ERC20Service, RealitioService } from '../../../../services'
import { realitioAbi } from '../../../../services/realitio'
import { SafeService } from '../../../../services/safe'
import { getLogger } from '../../../../util/logger'
import { getContractAddress, getNativeAsset } from '../../../../util/networks'
import { bigNumberToNumber, bigNumberToString, getUnit, isDust } from '../../../../util/tools'
import {
  INVALID_ANSWER_ID,
  MarketDetailsTab,
  MarketMakerData,
  OutcomeTableValue,
  Status,
  TransactionStep,
} from '../../../../util/types'
import { Button, ButtonContainer } from '../../../button'
import { ButtonType } from '../../../button/button_styling_types'
import { ModalTransactionWrapper } from '../../../modal'
import { BalanceItems, BalanceSection } from '../../../modal/common_styled'
import { MarketScale } from '../../common_sections/card_bottom_details/market_scale'
import { MarketTopDetailsClosed } from '../../common_sections/card_top_details/market_top_details_closed'
import { History_select } from '../../common_sections/history/history_section/history_select'
import { HistoryTable } from '../../common_sections/history/history_table/index'
import MarketResolutionMessage from '../../common_sections/message_text/market_resolution_message'
import { OutcomeTable } from '../../common_sections/tables/outcome_table'
import { ViewCard } from '../../common_sections/view_card'
import { MarginsButton } from '../../common_styled'
//import { Outcome, Outcomes } from '../../market_create/steps/outcomes/index'
import { MarketNavigation } from '../../market_navigation'
import { MarketPoolLiquidity } from '../../market_pooling/market_pool_liquidity'

const TopCard = styled(ViewCard)`
  padding-bottom: 0;
  margin-bottom: 24px;
`

const BottomCard = styled(ViewCard)``

const MarketResolutionMessageStyled = styled(MarketResolutionMessage)`
  margin: 20px 0;
`

const StyledButtonContainer = styled(ButtonContainer)`
  margin: 0 -24px;
  margin-bottom: -1px;
  padding: 20px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BorderedButtonContainer = styled(ButtonContainer)`
  ${MarginsButton};
`

const SellBuyWrapper = styled.div`
  display: flex;
  align-items: center;

  & > * + * {
    margin-left: 12px;
  }
`

interface Props extends RouteComponentProps<Record<string, string | undefined>> {
  isScalar: boolean
  marketMakerData: MarketMakerData
  fetchGraphMarketMakerData: () => Promise<void>
  //Demiurge
  sharedProps: SharedPropsInterface
  fpmmTrade: FpmmTradeDataType[]
}

const logger = getLogger('Market::ClosedMarketDetails')

const computeEarnedCollateral = (payouts: Maybe<Big[]>, balances: BigNumber[]): Maybe<BigNumber> => {
  if (!payouts) {
    return null
  }

  // use floor as rounding method
  Big.RM = 0

  const earnedCollateralPerOutcome = balances.map((balance, index) => new Big(balance.toString()).mul(payouts[index]))
  const earnedCollateral = earnedCollateralPerOutcome.reduce((a, b) => a.add(b.toFixed(0)), bigNumberify(0))

  return earnedCollateral
}

const scalarComputeEarnedCollateral = (finalAnswerPercentage: Big, balances: BigNumber[]): Maybe<BigNumber> => {
  if (
    (!balances[0] && !balances[1]) ||
    (balances[0].isZero() && !balances[1]) ||
    (!balances[0] && balances[1].isZero()) ||
    (balances[0].isZero() && balances[1].isZero())
  )
    return null

  // use floor as rounding method
  Big.RM = 0

  const shortEarnedCollateral = new Big(balances[0].toString()).mul(new Big(1).sub(finalAnswerPercentage))
  const longEarnedCollateral = new Big(balances[1].toString()).mul(finalAnswerPercentage)
  const collaterals = [shortEarnedCollateral, longEarnedCollateral]
  const earnedCollateral = collaterals.reduce((a, b) => a.add(b.toFixed(0)), bigNumberify(0))

  return earnedCollateral
}

const calcUserWinningsData = (
  isScalar: boolean,
  shares: BigNumber[],
  payouts: Maybe<Big[]>,
  finalAnswerPercentage: number,
): { userWinningShares: BigNumber; winningOutcomes: number; userWinningOutcomes: number } => {
  let userWinningShares
  let winningOutcomes
  let userWinningOutcomes
  if (isScalar) {
    userWinningShares = shares.reduce((acc, outcome) => (acc && outcome ? acc.add(outcome) : Zero)) || Zero
    winningOutcomes = finalAnswerPercentage === (0 || 1) ? 1 : 2
    userWinningOutcomes = shares.filter((share, i) => {
      const finalAnswerMultiple = i === 0 ? 1 - finalAnswerPercentage : finalAnswerPercentage
      return share && share.gt(Zero) && finalAnswerMultiple > 0
    }).length
  } else {
    userWinningShares = payouts
      ? shares.reduce((acc, shares, index) => (payouts[index].gt(0) && shares ? acc.add(shares) : acc), Zero)
      : Zero
    winningOutcomes = payouts ? payouts.filter(payout => payout.gt(0)).length : 0
    userWinningOutcomes = payouts
      ? payouts.filter((payout, index) => shares[index] && shares[index].gt(0) && payout.gt(0)).length
      : 0
  }
  return { userWinningShares, winningOutcomes, userWinningOutcomes }
}

const Wrapper = (props: Props) => {
  const context = useConnectedWeb3Context()
  const { fetchBalances } = context.balances

  const { account, cpk, library: provider, networkId, relay, setTxState, txHash, txState } = context
  const { buildMarketMaker, buildOracle, conditionalTokens, realitio } = useContracts(context)
  //Demiurge
  const { fetchGraphMarketMakerData, isScalar, marketMakerData, sharedProps } = props

  const {
    address: marketMakerAddress,
    arbitrator,
    balances,
    collateral: collateralToken,
    isConditionResolved,
    payouts,
    question,
    realitioAnswer,
    scalarHigh,
    scalarLow,
  } = marketMakerData

  //Demiurge
  //const { totalCollateralShortage, totalShareSurplus } = sharedProps

  const history = useHistory()
  const location = useLocation()

  const [status, setStatus] = useState<Status>(Status.Ready)
  const [message, setMessage] = useState('')

  const [collateral, setCollateral] = useState<BigNumber>(new BigNumber(0))
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false)
  const [userRealitioWithdraw, setUserRealitioWithdraw] = useState(false)
  const [cpkRealitioWithdraw, setCpkRealitioWithdraw] = useState(false)
  const [userRealitioBalance, setUserRealitioBalance] = useState(Zero)
  const [cpkRealitioBalance, setCpkRealitioBalance] = useState(Zero)

  const marketMaker = useMemo(() => buildMarketMaker(marketMakerAddress), [buildMarketMaker, marketMakerAddress])
  const oracle = useMemo(() => buildOracle(marketMakerData.oracle), [buildOracle, marketMakerData.oracle])

  const resolveCondition = async () => {
    if (!cpk) {
      return
    }
    try {
      setStatus(Status.Loading)
      setMessage('Resolving condition...')
      setTxState(TransactionStep.waitingConfirmation)
      setIsTransactionModalOpen(true)

      await cpk.resolveCondition({
        oracle,
        realitio,
        isScalar,
        scalarLow,
        scalarHigh,
        question,
        numOutcomes: balances.length,
      })

      await fetchGraphMarketMakerData()

      setStatus(Status.Ready)
      setMessage(`Condition successfully resolved.`)
    } catch (err) {
      setStatus(Status.Error)
      setTxState(TransactionStep.error)
      setMessage(`Error trying to resolve the condition.`)
      logger.error(`${message} - ${err.message}`)
    }
  }

  useEffect(() => {
    let isSubscribed = true

    const fetchBalance = async () => {
      const collateralAddress = await marketMaker.getCollateralToken()
      const collateralService = new ERC20Service(provider, account, collateralAddress)
      const collateralBalance = await collateralService.getCollateral(marketMakerAddress)
      if (isSubscribed) setCollateral(collateralBalance)
    }

    fetchBalance()

    return () => {
      isSubscribed = false
    }
  }, [provider, account, marketMakerAddress, marketMaker])

  const getRealitioBalance = async () => {
    if (!cpk || !account) {
      return
    }

    // Check if user has reality balance to redeem
    const realitioService = new RealitioService(
      getContractAddress(networkId, 'realitio'),
      getContractAddress(networkId, 'realitioScalarAdapter'),
      provider,
      account,
    )

    const claimable = await realitioService.getClaimableBonds(question.id, question.currentAnswer)

    if (account !== cpk.address) {
      const userClaimable = claimable[account] || new BigNumber('0')
      const userBalance = await realitioService.getBalanceOf(account)
      const userTotal = userClaimable.add(userBalance)
      setUserRealitioBalance(userTotal)
      setUserRealitioWithdraw(userTotal.gt(Zero))
    }

    const cpkClaimable = claimable[cpk.address] || new BigNumber('0')
    const cpkBalance = await realitioService.getBalanceOf(cpk.address)
    const cpkTotal = cpkClaimable.add(cpkBalance)
    setCpkRealitioWithdraw(cpkTotal.gt(Zero))
    setCpkRealitioBalance(cpkTotal)
  }

  useEffect(() => {
    getRealitioBalance()
    // eslint-disable-next-line
  }, [cpk, networkId, provider, account, question, isConditionResolved])

  const claimBond = async () => {
    try {
      setStatus(Status.Loading)
      setMessage('Claiming bond...')
      setTxState(TransactionStep.waitingConfirmation)
      setIsTransactionModalOpen(true)

      await realitio.withdraw()
      await fetchBalances()
      await getRealitioBalance()

      setStatus(Status.Ready)
      setMessage(`Bond successfully claimed.`)
    } catch (err) {
      setStatus(Status.Error)
      setTxState(TransactionStep.error)
      setMessage(`Error trying to claim.`)
      logger.error(`${message} -  ${err.message}`)
    }
  }

  const probabilities = balances.map(balance => balance.probability)

  const disabledColumns = [OutcomeTableValue.Outcome, OutcomeTableValue.Probability, OutcomeTableValue.Bonded]

  if (!account) {
    disabledColumns.push(OutcomeTableValue.Shares)
  }

  const buySellButtons = (
    <SellBuyWrapper>
      <Button
        buttonType={ButtonType.secondaryLine}
        disabled={true}
        onClick={() => {
          setCurrentTab(MarketDetailsTab.sell)
        }}
      >
        Sell
      </Button>
      <Button
        buttonType={ButtonType.secondaryLine}
        disabled={true}
        onClick={() => {
          setCurrentTab(MarketDetailsTab.buy)
        }}
      >
        Buy
      </Button>
    </SellBuyWrapper>
  )

  const [currentTab, setCurrentTab] = useState(MarketDetailsTab.swap)

  const switchMarketTab = (newTab: MarketDetailsTab) => {
    setCurrentTab(newTab)
  }

  useEffect(() => {
    history.replace(`/${marketMakerAddress}/${currentTab.toLowerCase()}`)
    if (currentTab === MarketDetailsTab.swap) return history.replace(`/${marketMakerAddress}/finalize`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  useEffect(() => {
    if (location.pathname.includes('finalize')) setCurrentTab(MarketDetailsTab.swap)
    if (location.pathname.includes('pool')) setCurrentTab(MarketDetailsTab.pool)
    if (location.pathname.includes('history')) setCurrentTab(MarketDetailsTab.history)
    if (location.pathname.includes('set_outcome')) setCurrentTab(MarketDetailsTab.swap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { fetchData: fetchGraphMarketUserTxData } = useGraphMarketUserTxData(
    marketMakerAddress,
    cpk?.address.toLowerCase(),
  )

  const realitioAnswerNumber = bigNumberToNumber(realitioAnswer || new BigNumber(0), STANDARD_DECIMALS)
  const scalarLowNumber = bigNumberToNumber(scalarLow || new BigNumber(0), STANDARD_DECIMALS)
  const scalarHighNumber = bigNumberToNumber(scalarHigh || new BigNumber(0), STANDARD_DECIMALS)

  const unclampedFinalAnswerPercentage =
    realitioAnswer && realitioAnswer.eq(MaxUint256)
      ? 0.5
      : isConditionResolved
      ? balances[1].payout
      : (realitioAnswerNumber - scalarLowNumber) / (scalarHighNumber - scalarLowNumber)

  const finalAnswerPercentage =
    unclampedFinalAnswerPercentage > 1 ? 1 : unclampedFinalAnswerPercentage < 0 ? 0 : unclampedFinalAnswerPercentage

  const earnedCollateral = isScalar
    ? scalarComputeEarnedCollateral(
        new Big(finalAnswerPercentage),
        balances.map(balance => balance.shares),
      )
    : computeEarnedCollateral(
        payouts,
        balances.map(balance => balance.shares),
      )
  const hasWinningOutcomes = earnedCollateral && !isDust(earnedCollateral, collateralToken.decimals)

  const { userWinningOutcomes, userWinningShares, winningOutcomes } = calcUserWinningsData(
    isScalar,
    balances.map(balance => balance.shares),
    payouts,
    Number(finalAnswerPercentage),
  )

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

  let totalCollateralShortage = new BigNumber('0')
  let totalShareSurplus = new BigNumber('0')
  let isLiquidityCleared = false
  let isQualifiedForCompensation = false
  let netLiquidityCompensationCollateralAmount = new BigNumber('0')
  let isQualifiedForProvision = false
  let netLiquidityProvisionCollateralAmount = new BigNumber('0')
  console.log('user address', conditionalTokens.signerAddress)

  //Demiurge
  let resolutionTimestamp = new Date('Fri Dec 30 2999 06:00:00 GMT-0500 (Eastern Standard Time)').getTime()
  if (NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0]) {
    resolutionTimestamp = Date.parse(
      NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0],
    )
  } else {
    resolutionTimestamp = question.resolution.getTime()
  }

  if (fpmmTransactions && cpk) {
    //Liquidity Protection Prerequisite 0: totalCollateralShortage
    //const test = fpmmTransactions
    //.filter(({ user }) => user.id === conditionalTokens.signerAddress)
    //console.log(test, 'test')
    const totalWithdrawnCollateralTokens = fpmmTransactions
      .filter(item => item.fpmmType === 'Liquidity')
      .filter(item => item.transactionType === 'Withdraw')
      .map(item =>
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.collateralTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    const totalWithdrawnPoolTokens = fpmmTransactions
      .filter(item => item.fpmmType === 'Liquidity')
      .filter(item => item.transactionType === 'Withdraw')
      .map(item =>
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.sharesOrPoolTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    totalCollateralShortage = totalWithdrawnPoolTokens.sub(totalWithdrawnCollateralTokens)
    console.log(
      'cpk address',
      cpk.address.toLowerCase(),
      totalWithdrawnPoolTokens.toString(),
      totalWithdrawnCollateralTokens.toString(),
      'totalCollateralShortage',
      totalCollateralShortage.toString(),
    )
    //Liquidity Protection Prerequisite 1: all added pooltokens have been removed;
    const totalDepositedPoolTokens = fpmmTransactions
      .filter(item => item.fpmmType === 'Liquidity')
      .filter(item => item.transactionType === 'Deposit')
      .map(item =>
        //ATTN: cpk.address.toLowerCase() is right for non-market-creator LPs,  0x0fb4340432e56c014fa96286de17222822a9281b is right for market-creator LP
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.sharesOrPoolTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    console.log(totalDepositedPoolTokens.sub(totalWithdrawnPoolTokens).toString())
    console.log('totalDepositedPoolTokens', totalDepositedPoolTokens.toString())
    console.log('totalWithdrawnPoolTokens', totalWithdrawnPoolTokens.toString())
    if (totalDepositedPoolTokens.eq(totalWithdrawnPoolTokens)) {
      isLiquidityCleared = true
      //ATTN: limit pre-resolution trade does not work because fpmmTransactions is Liquidity only
      //Liquidity Protection Prerequisite 2: no withdraw happens before the resolution date.
      const totalEarlyWithdrawnPoolTokens = fpmmTransactions
        .filter(item => item.fpmmType === 'Liquidity')
        .filter(item => item.transactionType === 'Withdraw')
        .filter(item => item.creationTimestamp <= resolutionTimestamp)
        .map(item =>
          item.user.id.toLowerCase() === cpk.address.toLowerCase()
            ? [item.sharesOrPoolTokenAmount, item.user.id]
            : [Zero, item.user.id],
        )
        .reduce((a, b) => a.add(b[0]), Zero)
      console.log(totalEarlyWithdrawnPoolTokens.toString())
      if (totalEarlyWithdrawnPoolTokens === Zero) {
        //Liquidity Protection Prerequisite 3: totalShareSurplus netting userWinningShares is negative
        totalShareSurplus = balances
          .map(balance => balance.shares)
          .reduce((a, b) => a.add(b))
          .mul(-1)
          .add(userWinningShares)
        console.log(userWinningShares.toString(), 'totalShareSurplus', totalShareSurplus.toString())
        if (totalShareSurplus < Zero) {
          isQualifiedForCompensation = true
          netLiquidityCompensationCollateralAmount = totalCollateralShortage
          console.log('isQualifiedForCompensation', netLiquidityCompensationCollateralAmount)
        } else {
          if (totalShareSurplus > Zero) {
            isQualifiedForProvision = true
            netLiquidityProvisionCollateralAmount = userWinningShares.sub(totalCollateralShortage)
            //console.log(netLiquidityProvisionCollateralAmount.toString())
            console.log('isQualifiedForProvision', isQualifiedForProvision)
          }
        }
      }
    }
  }

  //Demiurge
  const demand = async () => {
    try {
      if (!cpk) {
        return
      }
      setStatus(Status.Loading)
      setMessage(`Your demand of liquidity protection starts...`)
      setTxState(TransactionStep.waitingConfirmation)
      setIsTransactionModalOpen(true)

      await cpk.demandProtection({
        amountToMerge: netLiquidityCompensationCollateralAmount,
        outcomesCount: balances.length,
        collateral: collateralToken,
        marketMaker,
        conditionalTokens,
        sharesToBurn: totalShareSurplus.mul(-1),
        earnings: Zero,
      })
      await fetchBalances()
      await getRealitioBalance()

      setStatus(Status.Ready)
      setMessage(`Your demand of liquidity protection successfully satisified.`)
    } catch (err) {
      setStatus(Status.Error)
      setTxState(TransactionStep.error)
      setMessage(`Error trying to meet your demand of liquidity protection.`)
      logger.error(`${message} -  ${err.message}`)
    }
  }

  //Demiurge
  const supply = async () => {
    try {
      if (!cpk) {
        return
      }
      setStatus(Status.Loading)
      setMessage(`Your supply of liquidity protection starts...`)
      setTxState(TransactionStep.waitingConfirmation)
      setIsTransactionModalOpen(true)

      await cpk.supplyProtection({
        amountToMerge: netLiquidityProvisionCollateralAmount,
        outcomesCount: balances.length,
        collateral: collateralToken,
        marketMaker,
        conditionalTokens,
        sharesToBurn: totalShareSurplus.mul(-1),
        earnings: Zero,
      })
      await fetchBalances()
      await getRealitioBalance()

      setStatus(Status.Ready)
      setMessage(`Your supply of liquidity protection successfully completed.`)
    } catch (err) {
      setStatus(Status.Error)
      setTxState(TransactionStep.error)
      setMessage(`Error trying to complete your supply of liquidity protection.`)
      logger.error(`${message} -  ${err.message}`)
    }
  }

  const redeem = async () => {
    try {
      if (!cpk) {
        return
      }

      setStatus(Status.Loading)
      setMessage('Redeeming non-liquidity payout...')
      setTxState(TransactionStep.waitingConfirmation)
      setIsTransactionModalOpen(true)

      await cpk.redeemPositions({
        isConditionResolved,
        // Round down in case of precision error
        amount: earnedCollateral ? earnedCollateral.mul(99999999).div(100000000) : new BigNumber('0'),
        question,
        numOutcomes: balances.length,
        oracle,
        realitio,
        isScalar,
        scalarLow,
        scalarHigh,
        collateral: collateralToken,
        marketMaker,
        conditionalTokens,
        realitioBalance: cpkRealitioBalance,
      })
      await fetchBalances()
      await getRealitioBalance()

      setStatus(Status.Ready)
      setMessage(`Non-liquidity payout successfully redeemed.`)
    } catch (err) {
      setStatus(Status.Error)
      setTxState(TransactionStep.error)
      setMessage(`Error trying to redeem non-liquidity payout.`)
      logger.error(`${message} -  ${err.message}`)
    }
  }

  const EPS = 0.01

  let invalid = false

  if (isScalar) {
    if (realitioAnswer?.eq(new BigNumber(INVALID_ANSWER_ID))) {
      invalid = true
    } else {
      invalid = false
    }
  } else {
    invalid = payouts
      ? payouts.every(payout =>
          payout
            .sub(1 / payouts.length)
            .abs()
            .lte(EPS),
        )
      : false
  }

  const symbol = useSymbol(collateralToken)
  let redeemString = 'NaN'
  let balanceString = ''
  //Demiurge
  if (earnedCollateral) {
    redeemString = `${bigNumberToString(earnedCollateral, collateralToken.decimals)} ${symbol}`
  }
  const nativeAsset = getNativeAsset(networkId, relay)
  if (userRealitioWithdraw) {
    balanceString = `${bigNumberToString(userRealitioBalance, nativeAsset.decimals)} ${nativeAsset.symbol}`
  } else if (cpkRealitioWithdraw) {
    balanceString = `${bigNumberToString(cpkRealitioBalance, nativeAsset.decimals)} ${nativeAsset.symbol}`
  }

  return (
    <>
      <TopCard>
        <MarketTopDetailsClosed collateral={collateral} marketMakerData={marketMakerData} />
      </TopCard>
      <BottomCard>
        <MarketNavigation
          activeTab={currentTab}
          callback={(param: MarketMakerData, isScalar: boolean) => null}
          hasWinningOutcomes={hasWinningOutcomes}
          marketMakerData={marketMakerData}
          newResolution={new Date()}
          switchMarketTab={switchMarketTab}
        ></MarketNavigation>
        {currentTab === MarketDetailsTab.swap && (
          <>
            {isScalar ? (
              <MarketScale
                borderTop={true}
                collateral={props.marketMakerData.collateral}
                currentAnswer={props.marketMakerData.question.currentAnswer}
                currentAnswerBond={props.marketMakerData.question.currentAnswerBond}
                currentPrediction={unclampedFinalAnswerPercentage.toString()}
                isClosed={true}
                lowerBound={scalarLow || new BigNumber(0)}
                outcomePredictedByMarket={
                  props.marketMakerData.outcomeTokenMarginalPrices
                    ? props.marketMakerData.outcomeTokenMarginalPrices[1]
                    : null
                }
                startingPointTitle={'Final answer'}
                unit={getUnit(question.title)}
                upperBound={scalarHigh || new BigNumber(0)}
              />
            ) : (
              <OutcomeTable
                balances={balances}
                collateral={collateralToken}
                disabledColumns={disabledColumns}
                displayRadioSelection={false}
                payouts={payouts}
                probabilities={probabilities}
                withWinningOutcome={true}
              />
            )}
            <WhenConnected>
              {(hasWinningOutcomes || userRealitioWithdraw || cpkRealitioWithdraw) && (
                <MarketResolutionMessageStyled
                  arbitrator={arbitrator}
                  balanceString={balanceString}
                  collateralToken={collateralToken}
                  invalid={invalid}
                  realitioWithdraw={userRealitioWithdraw || cpkRealitioWithdraw}
                  redeemString={redeemString}
                  userWinningOutcomes={userWinningOutcomes}
                  userWinningShares={userWinningShares}
                  winningOutcomes={winningOutcomes}
                ></MarketResolutionMessageStyled>
              )}
              {isConditionResolved && !hasWinningOutcomes && !userRealitioWithdraw && !cpkRealitioWithdraw ? (
                <StyledButtonContainer>
                  <Button
                    buttonType={ButtonType.secondaryLine}
                    onClick={() => {
                      history.goBack()
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    buttonType={ButtonType.primary}
                    disabled={status === Status.Loading}
                    onClick={
                      userRealitioWithdraw
                        ? !isConditionResolved
                          ? resolveCondition
                          : claimBond
                        : isQualifiedForCompensation
                        ? demand
                        : redeem
                    }
                  >
                    {userRealitioWithdraw
                      ? !isConditionResolved
                        ? 'Resolve Condition'
                        : 'Redeem Bond'
                      : isQualifiedForCompensation
                      ? 'Demand Protection'
                      : 'Redeem'}
                  </Button>
                </StyledButtonContainer>
              ) : (
                <>
                  <BorderedButtonContainer
                    borderTop={
                      (hasWinningOutcomes !== null && hasWinningOutcomes) || userRealitioWithdraw || cpkRealitioWithdraw
                    }
                  >
                    <Button
                      buttonType={ButtonType.primary}
                      disabled={status === Status.Loading}
                      onClick={
                        userRealitioWithdraw
                          ? !isConditionResolved
                            ? resolveCondition
                            : claimBond
                          : hasWinningOutcomes || cpkRealitioWithdraw
                          ? isQualifiedForProvision
                            ? supply
                            : redeem
                          : resolveCondition
                      }
                    >
                      {userRealitioWithdraw
                        ? !isConditionResolved
                          ? 'Resolve Condition'
                          : 'Redeem Bond'
                        : hasWinningOutcomes || cpkRealitioWithdraw
                        ? isQualifiedForProvision
                          ? 'Supply Protection'
                          : 'Redeem'
                        : !isConditionResolved
                        ? 'Resolve Condition'
                        : ''}
                    </Button>
                  </BorderedButtonContainer>
                </>
              )}
            </WhenConnected>
          </>
        )}
        {currentTab === MarketDetailsTab.pool && (
          <MarketPoolLiquidityContainer
            fetchGraphMarketMakerData={fetchGraphMarketMakerData}
            fetchGraphMarketUserTxData={fetchGraphMarketUserTxData}
            isScalar={isScalar}
            marketMakerData={marketMakerData}
            switchMarketTab={switchMarketTab}
          />
        )}
        {currentTab === MarketDetailsTab.history && (
          <MarketHistoryContainer marketMakerData={marketMakerData} sharedProps={sharedProps} />
        )}
        {currentTab === MarketDetailsTab.buy && (
          <MarketBuyContainer
            fetchGraphMarketMakerData={fetchGraphMarketMakerData}
            fetchGraphMarketUserTxData={fetchGraphMarketUserTxData}
            isScalar={isScalar}
            marketMakerData={marketMakerData}
            switchMarketTab={switchMarketTab}
          />
        )}
        {currentTab === MarketDetailsTab.sell && (
          <MarketSellContainer
            currentTab={currentTab}
            fetchGraphMarketMakerData={fetchGraphMarketMakerData}
            fetchGraphMarketUserTxData={fetchGraphMarketUserTxData}
            isScalar={isScalar}
            marketMakerData={marketMakerData}
            switchMarketTab={switchMarketTab}
          />
        )}
      </BottomCard>
      <ModalTransactionWrapper
        confirmations={0}
        confirmationsRequired={0}
        isOpen={isTransactionModalOpen}
        message={message}
        onClose={() => setIsTransactionModalOpen(false)}
        txHash={txHash}
        txState={txState}
      />
    </>
  )
}

export const ClosedMarketDetails = withRouter(Wrapper)
