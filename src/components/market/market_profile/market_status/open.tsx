import { useQuery } from '@apollo/react-hooks'
import { MaxUint256, Zero } from 'ethers/constants'
import { BigNumber, hexZeroPad, parseUnits } from 'ethers/utils'
import gql from 'graphql-tag'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory, useLocation, withRouter } from 'react-router-dom'
import styled from 'styled-components'

import { NEW_RESOLUTION_DATE } from '../../../../common/new_resolution_dates'
import { WhenConnected, useConnectedWeb3Context } from '../../../../contexts'
import { useFundingBalance, useGraphMarketUserTxData } from '../../../../hooks'
import {
  FpmmTradeDataType,
  HistoryType,
  useGraphFpmmTransactionsFromQuestion,
} from '../../../../hooks/graph/useGraphFpmmTransactionsFromQuestion'
import { useRealityLink } from '../../../../hooks/useRealityLink'
import { MarketBondContainer } from '../../../../pages/market_sections/market_bond_container'
import { MarketBuyContainer } from '../../../../pages/market_sections/market_buy_container'
import { MarketHistoryContainer } from '../../../../pages/market_sections/market_history_container'
import {
  MarketPoolLiquidityContainer,
  SharedPropsInterface,
} from '../../../../pages/market_sections/market_pool_liquidity_container'
import { MarketSellContainer } from '../../../../pages/market_sections/market_sell_container'
import { MarketVerifyContainer } from '../../../../pages/market_sections/market_verify_container'
import { getNativeAsset, networkIds } from '../../../../util/networks'
import { getUnit, isDust } from '../../../../util/tools'
import { BalanceItem, MarketDetailsTab, MarketMakerData, OutcomeTableValue } from '../../../../util/types'
import { Button, ButtonContainer } from '../../../button'
import { ButtonType } from '../../../button/button_styling_types'
import { MarketScale } from '../../common_sections/card_bottom_details/market_scale'
import { MarketTopDetailsOpen } from '../../common_sections/card_top_details/market_top_details_open'
import { WarningMessage } from '../../common_sections/message_text/warning_message'
import { OutcomeTable } from '../../common_sections/tables/outcome_table'
import { ViewCard } from '../../common_sections/view_card'
import { MarketNavigation } from '../../market_navigation'
//Demiurge
import {
  UserPoolData,
  totalAdditionalFailureOutcomeTokens,
  totalAdditionalSuccessOutcomeTokens,
} from '../../market_pooling/user_pool_data'

export const TopCard = styled(ViewCard)`
  padding: 24px;
  padding-bottom: 0;
  margin-bottom: 1px;
`
export const BottomCard = styled(ViewCard)``

export const StyledButtonContainer = styled(ButtonContainer)`
  margin: 0 -24px;
  margin-bottom: 5px;
  padding: 20px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &.border {
    border-top: 1px solid ${props => props.theme.colors.verticalDivider};
  }
`

const MarketBottomNavGroupWrapper = styled.div`
  display: flex;
  align-items: center;

  & > * + * {
    margin-left: 12px;
  }
`

const MarketBottomFinalizeNavGroupWrapper = styled.div`
  display: flex;
  align-items: center;
  & > * + * {
    margin-left: 12px;
  }
`

const WarningMessageStyled = styled(WarningMessage)`
  margin-top: 20px;
`

interface Props extends RouteComponentProps<Record<string, string | undefined>> {
  account: Maybe<string>
  isScalar: boolean
  marketMakerData: MarketMakerData
  fetchGraphMarketMakerData: () => Promise<void>
  sharedProps: SharedPropsInterface
}

const Wrapper = (props: Props) => {
  const { fetchGraphMarketMakerData, isScalar, marketMakerData, sharedProps } = props
  //Demiurge
  const { totalCollateralShortage, totalPriceData, totalShareSurplus, totalUserLiquidity } = sharedProps
  let { totalUnrealizedPotentialFailurePnL, totalUnrealizedPotentialSuccessPnL } = sharedProps
  const realitioBaseUrl = useRealityLink()
  const history = useHistory()
  const location = useLocation()
  const context = useConnectedWeb3Context()
  const cpk = context.cpk

  const {
    address: marketMakerAddress,
    balances,
    collateral,
    creator,
    fee,
    isConditionResolved,
    isQuestionFinalized,
    outcomeTokenMarginalPrices,
    payouts,
    question,
    scalarHigh,
    scalarLow,
    totalEarnings,
    totalPoolShares,
    userEarnings,
  } = marketMakerData
  const { library: provider, networkId } = context

  const nativeAsset = getNativeAsset(networkId)
  const initialBondAmount =
    networkId === networkIds.XDAI ? parseUnits('10', nativeAsset.decimals) : parseUnits('0.01', nativeAsset.decimals)

  const [bondNativeAssetAmount, setBondNativeAssetAmount] = useState<BigNumber>(
    question.currentAnswerBond ? new BigNumber(question.currentAnswerBond).mul(2) : initialBondAmount,
  )

  const [blocktime, setBlocktime] = useState<number>()

  let resolutionTime = new Date('Fri Dec 30 2999 06:00:00 GMT-0500 (Eastern Standard Time)').getTime()
  if (NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0]) {
    resolutionTime = Date.parse(
      NEW_RESOLUTION_DATE.filter(item => item.question_title === question.title).map(item => item.new_date)[0],
    )
  } else {
    resolutionTime = marketMakerData.question.resolution.getTime()
  }
  const isQuestionOpen = resolutionTime < (blocktime ? blocktime : Date.now())

  //Demiurge
  const { fetchFundingBalance, fundingBalance: maybeFundingBalance } = useFundingBalance(marketMakerAddress, context)
  const fundingBalance = maybeFundingBalance || Zero
  fetchFundingBalance()
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
      fpmmType: 'Trade',
    },
    onCompleted: ({ fpmmTransactions }: any) => {
      const internalArray = fpmmTransactions

      setFpmmTransactions(wrangleResponse(internalArray, 3))
    },
  })

  useEffect(() => {
    setFpmmTransactions(null)
  }, [marketMakerAddress, 'Trade'])

  if (data && data.fpmmTransactions && fpmmTransactions === null) {
    setFpmmTransactions(wrangleResponse(data.fpmmTransactions, 3))
  }

  //PnL Calculation 1: Unrealized PnL;
  //ATTN: Realized PnL can't be calculated without outome-specific sale records;
  let totalUnrealizedCollateral = new BigNumber('0')
  let totalRealizedCollateral = new BigNumber('0')
  let totalUnrealizedOutcomeToken = new BigNumber('0')
  let totalRealizedOutcomeToken = new BigNumber('0')
  let totalUnrealizedOutcomeTokenPerType = [new BigNumber('0'), new BigNumber('0')]
  let totalUnrealizedAverageCost = new Number('0')
  let totalUnrealizedSuccessPositionRatio = new Number('0')
  let totalUnrealizedFailurePositionRatio = new Number('0')
  //let totalUnrealizedPotentialSuccessPnL = new Number('0')
  //let totalUnrealizedPotentialFailurePnL = new Number('0')

  if (fpmmTransactions && cpk) {
    //Liquidity Protection Prerequisite 0: totalCollateralShortage
    //const test = fpmmTransactions
    //console.log(test, 'tradetest')
    totalUnrealizedCollateral = fpmmTransactions
      .filter(item => item.fpmmType === 'Trade')
      .filter(item => item.transactionType === 'Buy')
      .map(item =>
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.collateralTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    totalRealizedCollateral = fpmmTransactions
      .filter(item => item.fpmmType === 'Trade')
      .filter(item => item.transactionType === 'Sell')
      .map(item =>
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.collateralTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    totalUnrealizedCollateral.sub(totalRealizedCollateral)

    totalUnrealizedOutcomeToken = fpmmTransactions
      .filter(item => item.fpmmType === 'Trade')
      .filter(item => item.transactionType === 'Buy')
      .map(item =>
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.sharesOrPoolTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    totalRealizedOutcomeToken = fpmmTransactions
      .filter(item => item.fpmmType === 'Trade')
      .filter(item => item.transactionType === 'Sell')
      .map(item =>
        item.user.id.toLowerCase() === cpk.address.toLowerCase()
          ? [item.sharesOrPoolTokenAmount, item.user.id]
          : [Zero, item.user.id],
      )
      .reduce((a, b) => a.add(b[0]), Zero)
    totalUnrealizedOutcomeToken.sub(totalRealizedOutcomeToken)
    //console.log('check import',totalAdditionalSuccessOutcomeTokens.toString(),totalAdditionalFailureOutcomeTokens.toString(),)
    //Step 3: Calculate total additional outcome tokens from withdrawing liquidity (adding all Cs);
    //CAUTION: MISSING the buy/sell distribution ratio of additional outcome tokens depends on the price at times;
    //console.log('old PnL', totalUnrealizedPotentialSuccessPnL, totalUnrealizedPotentialFailurePnL)
    //CAUTION: all previous inputs to data becomes zero!!
    //console.log('totalUnrealizedOutcomeToken', totalUnrealizedCollateral, totalUnrealizedOutcomeToken)
    totalUnrealizedOutcomeToken = totalUnrealizedOutcomeToken
      .sub(totalAdditionalSuccessOutcomeTokens)
      .sub(totalAdditionalFailureOutcomeTokens)
    totalUnrealizedOutcomeTokenPerType = balances.map(balance => balance.shares)
    totalUnrealizedSuccessPositionRatio =
      Number(totalUnrealizedOutcomeTokenPerType[0].sub(totalAdditionalSuccessOutcomeTokens)) /
      Number(totalUnrealizedOutcomeToken)
    totalUnrealizedFailurePositionRatio =
      Number(totalUnrealizedOutcomeTokenPerType[1].sub(totalAdditionalFailureOutcomeTokens)) /
      Number(totalUnrealizedOutcomeToken)
    //console.log('import successToken, failureToken, total', totalUnrealizedOutcomeToken.toString(),totalAdditionalSuccessOutcomeTokens.toString(),totalAdditionalFailureOutcomeTokens.toString(),)
    //console.log('totalUnrealizedSuccessPositionRatio, totalUnrealizedFailurePositionRatio, ')
    if (!totalUnrealizedOutcomeToken.eq(Zero)) {
      totalUnrealizedAverageCost = Number(totalUnrealizedCollateral) / Number(totalUnrealizedOutcomeToken)
      totalUnrealizedPotentialSuccessPnL =
        (1 * Number(totalUnrealizedSuccessPositionRatio) - Number(totalUnrealizedAverageCost)) /
        Number(totalUnrealizedAverageCost)
      totalUnrealizedPotentialFailurePnL =
        (1 * Number(totalUnrealizedFailurePositionRatio) - Number(totalUnrealizedAverageCost)) /
        Number(totalUnrealizedAverageCost)
    }
    //console.log('new PnL', totalUnrealizedPotentialSuccessPnL, totalUnrealizedPotentialFailurePnL)
  }

  useEffect(() => {
    if (question.currentAnswerBond && !new BigNumber(question.currentAnswerBond).mul(2).eq(bondNativeAssetAmount)) {
      setBondNativeAssetAmount(new BigNumber(question.currentAnswerBond).mul(2))
    }
    // eslint-disable-next-line
  }, [question.currentAnswerBond])

  useEffect(() => {
    const shouldFinalize = async () => {
      const block = await provider.getBlock('latest')
      const timestamp = block.timestamp * 1000
      //Demiurge
      const resolution = new Date(resolutionTime).getTime()
      //console.log('useEffect resolution', new Date(resolutionTime), new Date(resolution))
      if (resolution < timestamp) {
        setCurrentTab(MarketDetailsTab.finalize)
        fetchGraphMarketMakerData()
      } else {
        setTimeout(shouldFinalize, 2000)
      }
      setBlocktime(timestamp)
    }
    shouldFinalize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const userHasShares = balances.some((balanceItem: BalanceItem) => {
    const { shares } = balanceItem
    return shares && !isDust(shares, collateral.decimals)
  })

  const probabilities = balances.map(balance => balance.probability)
  const hasFunding = totalPoolShares.gt(0)

  const renderTableData = () => {
    const disabledColumns = [
      OutcomeTableValue.Payout,
      OutcomeTableValue.Outcome,
      OutcomeTableValue.Probability,
      OutcomeTableValue.Bonded,
    ]
    if (!userHasShares) {
      disabledColumns.push(OutcomeTableValue.Shares)
    }
    return (
      <OutcomeTable
        balances={balances}
        collateral={collateral}
        disabledColumns={disabledColumns}
        displayRadioSelection={false}
        probabilities={probabilities}
      />
    )
  }

  const renderFinalizeTableData = () => {
    const disabledColumns = [
      OutcomeTableValue.OutcomeProbability,
      OutcomeTableValue.Probability,
      OutcomeTableValue.CurrentPrice,
      OutcomeTableValue.Payout,
    ]

    return (
      <OutcomeTable
        balances={balances}
        bonds={question.bonds}
        collateral={collateral}
        disabledColumns={disabledColumns}
        displayRadioSelection={false}
        isBond
        payouts={payouts}
        probabilities={probabilities}
        withWinningOutcome
      />
    )
  }

  const finalizeButtons = (
    <MarketBottomFinalizeNavGroupWrapper>
      <Button
        buttonType={ButtonType.secondaryLine}
        onClick={() => {
          window.open(`${realitioBaseUrl}/#!/question/${question.id}`)
        }}
      >
        Call Arbitrator
      </Button>
      <Button
        buttonType={ButtonType.primary}
        onClick={() => {
          setCurrentTab(MarketDetailsTab.setOutcome)
        }}
      >
        Set Outcome
      </Button>
    </MarketBottomFinalizeNavGroupWrapper>
  )

  const buySellButtons = (
    <MarketBottomNavGroupWrapper>
      <Button
        buttonType={ButtonType.sellSecondaryLine}
        disabled={!userHasShares || !hasFunding}
        onClick={() => {
          setCurrentTab(MarketDetailsTab.sell)
        }}
      >
        Sell
      </Button>
      <div />
      <Button
        buttonType={ButtonType.buySecondaryLine}
        disabled={!hasFunding}
        onClick={() => {
          setCurrentTab(MarketDetailsTab.buy)
        }}
      >
        Buy
      </Button>
    </MarketBottomNavGroupWrapper>
  )

  const isFinalizing = isQuestionOpen && !isQuestionFinalized

  const [currentTab, setCurrentTab] = useState(
    isQuestionFinalized || !isFinalizing ? MarketDetailsTab.swap : MarketDetailsTab.finalize,
  )

  const switchMarketTab = (newTab: MarketDetailsTab) => {
    setCurrentTab(newTab)
  }

  const isMarketCreator = cpk && creator === cpk.address.toLowerCase()

  const { fetchData: fetchGraphMarketUserTxData, liquidityTxs, status, trades } = useGraphMarketUserTxData(
    marketMakerAddress,
    cpk?.address.toLowerCase(),
    isMarketCreator || false,
    context.networkId,
  )

  useEffect(() => {
    if ((isQuestionFinalized || !isFinalizing) && currentTab === MarketDetailsTab.finalize) {
      setCurrentTab(MarketDetailsTab.swap)
    }
    // eslint-disable-next-line
  }, [isQuestionFinalized, isFinalizing])

  useEffect(() => {
    if (location.pathname.includes('buy')) setCurrentTab(MarketDetailsTab.buy)
    if (location.pathname.includes('sell')) setCurrentTab(MarketDetailsTab.sell)
    if (location.pathname.includes('pool')) setCurrentTab(MarketDetailsTab.pool)
    if (location.pathname.includes('verify')) setCurrentTab(MarketDetailsTab.verify)
    if (location.pathname.includes('history')) setCurrentTab(MarketDetailsTab.history)
    if (location.pathname.includes('set_outcome')) setCurrentTab(MarketDetailsTab.setOutcome)
    if (location.pathname.includes('finalize')) setCurrentTab(MarketDetailsTab.finalize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentTab === MarketDetailsTab.swap) return history.replace(`/${marketMakerAddress}`)
    return history.replace(`/${marketMakerAddress}/${currentTab.toLowerCase()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  return (
    <>
      <TopCard>
        <MarketTopDetailsOpen blocktime={blocktime} marketMakerData={marketMakerData} />
      </TopCard>
      <BottomCard>
        <UserPoolData
          collateral={collateral}
          marketMakerData={marketMakerData}
          sharedProps={sharedProps}
          symbol={collateral.symbol}
          //Demiurge
          totalCollateralShortage={totalCollateralShortage}
          totalEarnings={totalEarnings}
          totalPoolShares={totalPoolShares}
          totalPriceData={totalPriceData}
          totalShareSurplus={totalShareSurplus}
          totalUnrealizedCollateral={totalUnrealizedCollateral}
          totalUnrealizedOutcomeToken={totalUnrealizedOutcomeToken}
          totalUnrealizedPotentialFailurePnL={totalUnrealizedPotentialFailurePnL}
          totalUnrealizedPotentialSuccessPnL={totalUnrealizedPotentialSuccessPnL}
          totalUserLiquidity={fundingBalance}
          userEarnings={userEarnings}
        />
        <MarketNavigation
          activeTab={currentTab}
          blocktime={blocktime}
          callback={(param: MarketMakerData, isScalar: boolean) => null}
          marketMakerData={marketMakerData}
          newResolution={new Date()}
          switchMarketTab={switchMarketTab}
        ></MarketNavigation>
        {currentTab === MarketDetailsTab.swap && (
          <>
            {isScalar ? (
              <>
                <MarketScale
                  balances={balances}
                  borderTop={true}
                  collateral={collateral}
                  currentPrediction={outcomeTokenMarginalPrices ? outcomeTokenMarginalPrices[1] : null}
                  fee={fee}
                  liquidityTxs={liquidityTxs}
                  lowerBound={scalarLow || new BigNumber(0)}
                  positionTable={true}
                  startingPointTitle={'Current prediction'}
                  status={status}
                  trades={trades}
                  unit={getUnit(question.title)}
                  upperBound={scalarHigh || new BigNumber(0)}
                />
              </>
            ) : (
              <>
                ${renderTableData()}
                <StyledButtonContainer className={!hasFunding || isQuestionOpen ? 'border' : ''}>
                  <Button
                    buttonType={ButtonType.secondaryLine}
                    onClick={() => {
                      history.goBack()
                    }}
                  >
                    Back
                  </Button>
                  {buySellButtons}
                </StyledButtonContainer>
                <MarketHistoryContainer marketMakerData={marketMakerData} sharedProps={sharedProps} />
              </>
              //renderTableData()
            )}
            {!hasFunding && !isQuestionOpen && (
              <WarningMessageStyled
                additionalDescription={''}
                description={'Trading is disabled due to lack of liquidity.'}
                grayscale={true}
                href={''}
                hyperlinkDescription={''}
              />
            )}
            <WhenConnected>
              <StyledButtonContainer className={!hasFunding || isQuestionOpen ? 'border' : ''}>
                <Button
                  buttonType={ButtonType.secondaryLine}
                  onClick={() => {
                    history.goBack()
                  }}
                >
                  Back
                </Button>
                {buySellButtons}
              </StyledButtonContainer>
            </WhenConnected>
          </>
        )}
        {currentTab === MarketDetailsTab.finalize ? (
          <>
            {isScalar ? (
              <MarketScale
                borderTop={true}
                collateral={collateral}
                currentAnswer={question.currentAnswer}
                currentAnswerBond={question.currentAnswerBond}
                currentPrediction={outcomeTokenMarginalPrices ? outcomeTokenMarginalPrices[1] : null}
                currentTab={MarketDetailsTab.finalize}
                isBonded={true}
                lowerBound={scalarLow || new BigNumber(0)}
                startingPointTitle={'Current prediction'}
                unit={getUnit(question.title)}
                upperBound={scalarHigh || new BigNumber(0)}
              />
            ) : (
              renderFinalizeTableData()
            )}
            <WhenConnected>
              <StyledButtonContainer>
                <Button
                  buttonType={ButtonType.secondaryLine}
                  onClick={() => {
                    history.goBack()
                  }}
                >
                  Back
                </Button>
                {finalizeButtons}
              </StyledButtonContainer>
            </WhenConnected>
          </>
        ) : null}
        {currentTab === MarketDetailsTab.setOutcome && (
          <MarketBondContainer
            bondNativeAssetAmount={bondNativeAssetAmount}
            fetchGraphMarketMakerData={fetchGraphMarketMakerData}
            isScalar={isScalar}
            marketMakerData={marketMakerData}
            switchMarketTab={switchMarketTab}
          />
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
        {currentTab === MarketDetailsTab.verify && (
          <MarketVerifyContainer
            context={context}
            fetchGraphMarketMakerData={fetchGraphMarketMakerData}
            marketMakerData={marketMakerData}
            switchMarketTab={switchMarketTab}
          />
        )}
      </BottomCard>
    </>
  )
}

export const OpenMarketDetails = withRouter(Wrapper)
