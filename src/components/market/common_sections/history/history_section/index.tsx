import { Block } from 'ethers/providers'
import { BigNumber } from 'ethers/utils'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from 'react'

import { EARLIEST_MAINNET_BLOCK_TO_CHECK, EARLIEST_RINKEBY_BLOCK_TO_CHECK } from '../../../../../common/constants'
import { useConnectedWeb3Context } from '../../../../../contexts'
import { useMultipleQueries } from '../../../../../hooks'
import { SharedPropsInterface } from '../../../../../pages/market_sections/market_pool_liquidity_container'
import { isScalarMarket, keys, range, waitABit } from '../../../../../util/tools'
import { Period } from '../../../../../util/types'
import { MarketMakerData } from '../../../../../util/types'

import { History_select } from './history_select'

// This query will return an object where each entry is
// `fixedProductMarketMaker_X: { outcomeTokenAmounts }`,
// where X is a block number,
//  and `outcomeTokenAmounts` is the amount of holdings of the market maker at that block.
const buildQueriesHistory = (blockNumbers: number[]) => {
  return blockNumbers.map(
    blockNumber => `query fixedProductMarketMaker_${blockNumber}($id: ID!) {
      fixedProductMarketMaker(id: $id, block: { number: ${blockNumber} }) {
        outcomeTokenAmounts
      }
    }
    `,
  )
}

type HistoricDataPoint = {
  block: Block
  holdings: string[]
}

type HistoricData = HistoricDataPoint[]

const useHoldingsHistory = (marketMakerAddress: string, blocks: Maybe<Block[]>): Maybe<HistoricData> => {
  const queries = useMemo(() => (blocks ? buildQueriesHistory(blocks.map(block => block.number)) : null), [blocks])

  const variables = useMemo(() => {
    return { id: marketMakerAddress }
  }, [marketMakerAddress])

  const queriesResult = useMultipleQueries<{ data: { [key: string]: { outcomeTokenAmounts: string[] } } }>(
    queries,
    variables,
  )

  if (queriesResult && blocks) {
    const result: HistoricData = []
    queriesResult
      .filter(d => d.data)
      .forEach((queryResult, index) => {
        Object.values(queryResult.data).forEach(value => {
          if (value && value.outcomeTokenAmounts) {
            const block = blocks[index]
            const holdings = value.outcomeTokenAmounts
            result.push({ block, holdings })
          }
        })
      })

    return result
  }
  return null
}

type Props = {
  answerFinalizedTimestamp: Maybe<BigNumber>
  marketMakerAddress: string
  hidden: boolean
  outcomes: string[]
  oracle: Maybe<string>
  currency: string
  fee: BigNumber
  decimals: number
  scalarHigh: Maybe<BigNumber>
  scalarLow: Maybe<BigNumber>
  unit: string
  sharedProps: SharedPropsInterface
  marketMakerData: MarketMakerData
}
//Demiurge
//CAUTION: The assumption here is 15s per block
const blocksPerAllTimePeriod = 5760 * 365
const blocksPerDay = 5760
const blocksPerHour = Math.floor(blocksPerDay / 24)
const blocksPerMinute = Math.floor(blocksPerHour / 60)

const calcOffsetByDate = (nowOrClosedTs: number) => {
  const now = moment()
  const offsetInMinutes = moment(nowOrClosedTs)
    .startOf('day')
    .diff(now, 'minute')

  return -offsetInMinutes * blocksPerMinute
}

export const HistorySelectContainer: React.FC<Props> = ({
  answerFinalizedTimestamp,
  currency,
  decimals,
  fee,
  hidden,
  marketMakerAddress,
  marketMakerData,
  oracle,
  outcomes,
  scalarHigh,
  scalarLow,
  sharedProps,
  unit,
}) => {
  const { library, networkId } = useConnectedWeb3Context()
  const [latestBlockNumber, setLatestBlockNumber] = useState<Maybe<number>>(null)

  const [blocks, setBlocks] = useState<Maybe<Block[]>>(null)
  const holdingsSeries = useHoldingsHistory(marketMakerAddress, blocks)

  const [period, setPeriod] = useState<Period>('1H')

  const blocksOffset = useMemo(
    () => (answerFinalizedTimestamp ? calcOffsetByDate(answerFinalizedTimestamp.toNumber() * 1000) : 0),
    [answerFinalizedTimestamp],
  )

  const earliestBlock = networkId === 1 ? EARLIEST_MAINNET_BLOCK_TO_CHECK : EARLIEST_RINKEBY_BLOCK_TO_CHECK
  const blocksSinceInception = latestBlockNumber ? latestBlockNumber - earliestBlock : 0
  const allDataPoints = Math.floor(blocksSinceInception / blocksPerAllTimePeriod)

  //Demiurge
  const mapPeriod: {
    [period in Period]: { totalDataPoints: number; blocksPerPeriod: number; unitsPerPeriod: number }
  } = {
    //All: { totalDataPoints: allDataPoints, blocksPerPeriod: blocksPerAllTimePeriod, unitsPerPeriod: 0 },
    //'1Y': { totalDataPoints: 5, blocksPerPeriod: 365, unitsPerPeriod: 5760 },
    '1M': { totalDataPoints: 12, blocksPerPeriod: 240, unitsPerPeriod: 720 },
    '1W': { totalDataPoints: 24, blocksPerPeriod: 168, unitsPerPeriod: 240 },
    '1D': { totalDataPoints: 30, blocksPerPeriod: 160, unitsPerPeriod: 36 },
    '2H': { totalDataPoints: 60, blocksPerPeriod: 60, unitsPerPeriod: 8 },
    '1H': { totalDataPoints: 25, blocksPerPeriod: 24, unitsPerPeriod: 240 },
    '30m': { totalDataPoints: 120, blocksPerPeriod: 30, unitsPerPeriod: 4 },
    '15m': { totalDataPoints: 60, blocksPerPeriod: 20, unitsPerPeriod: 3 },
    '5m': { totalDataPoints: 20, blocksPerPeriod: 10, unitsPerPeriod: 2 },
    '2m': { totalDataPoints: 8, blocksPerPeriod: 8, unitsPerPeriod: 1 },
  }

  useEffect(() => {
    library.getBlockNumber().then((latest: number) => setLatestBlockNumber(latest - blocksOffset))
  }, [blocksOffset, library])

  //Demiurge
  useEffect(() => {
    const getBlocks = async (latestBlockNumber: number) => {
      const { blocksPerPeriod, totalDataPoints, unitsPerPeriod } = mapPeriod[period]
      if (latestBlockNumber) {
        const blockNumbers = range(totalDataPoints * blocksPerPeriod).map(
          multiplier => latestBlockNumber - multiplier * unitsPerPeriod,
        )
        //console.log('blocksPerPeriod, totalDataPoints, blockNumbers', blocksPerPeriod, totalDataPoints, blockNumbers)
        const blocks = await Promise.all(
          blockNumbers.map(async blockNumber => {
            let block
            while (!block) {
              try {
                block = await library.getBlock(blockNumber)
              } catch (e) {
                await waitABit()
              }
            }
            return block
          }),
        )
        setBlocks(blocks.filter(block => block))
      }
    }

    if (latestBlockNumber) {
      getBlocks(latestBlockNumber)
    }
    // eslint-disable-next-line
  }, [latestBlockNumber, library, period])

  const isScalar = isScalarMarket(oracle || '', networkId || 0)

  return hidden ? null : (
    <History_select
      currency={currency}
      decimals={decimals}
      fee={fee}
      holdingSeries={holdingsSeries}
      isScalar={isScalar}
      marketMakerAddress={marketMakerAddress}
      marketMakerData={marketMakerData}
      onChange={setPeriod}
      options={keys(mapPeriod)}
      outcomes={outcomes}
      scalarHigh={scalarHigh}
      scalarLow={scalarLow}
      sharedProps={sharedProps}
      //Demiurge
      //unit={unit}
      unit={mapPeriod[period].blocksPerPeriod}
      value={period}
    />
  )
}
