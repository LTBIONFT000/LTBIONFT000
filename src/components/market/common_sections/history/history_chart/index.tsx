import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'
import { BigNumber } from 'ethers/utils'
import React from 'react'
//Demiurge
import {
  BarSeries,
  CandlestickSeries,
  Chart,
  ChartCanvas,
  CrossHairCursor,
  CurrentCoordinate,
  EdgeIndicator,
  ElderRaySeries,
  HoverTooltip,
  LineSeries,
  MouseCoordinateX,
  MouseCoordinateY,
  MovingAverageTooltip,
  OHLCTooltip,
  SingleValueTooltip,
  XAxis,
  YAxis,
  ZoomButtons,
  discontinuousTimeScaleProviderBuilder,
  elderRay,
  ema,
  last,
  lastVisibleItemBasedZoomAnchor,
  withDeviceRatio,
  withSize,
} from 'react-financial-charts'
import { useHistory } from 'react-router'
//import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'

import { getOutcomeColor } from '../../../../../theme/utils'
import { calcPrediction } from '../../../../../util/tools'
import { Button } from '../../../../button'
import { ButtonType } from '../../../../button/button_styling_types'
import { OutcomeItemLittleBallOfJoyAndDifferentColors } from '../../../common_styled'
import { CustomInlineLoading } from '../history_table'

//Demiurge
//import Chart from './chart'
import './styles.css'

const ResponsiveWrapper = styled.div`
  margin: 21px 24.5px;
  border: 1px solid ${props => props.theme.borders.borderDisabled};
  padding-bottom: 16px;
  border-radius: 6px;
`

const ChartTooltip = styled.div`
  background: #fff;
  border-radius: 2px;
  border: 1px solid ${props => props.theme.borders.borderDisabled};
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.12);
  min-width: 160px;
  padding: 17px;
`

const TooltipTitle = styled.h4`
  color: ${props => props.theme.text1};
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0 0 10px;
  text-align: left;
`
const Legends = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`
const ButtonWrapper = styled.div`
  border-top: ${props => props.theme.borders.borderLineDisabled};
  padding-top: 20px;
  padding-left: 24px;
`
const Legend = styled.li`
  align-items: center;
  color: ${props => props.theme.text4};
  display: flex;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  margin: 0;
  padding: 0;

  strong {
    color: ${props => props.theme.text3};
    font-weight: 500;
    margin-right: 6px;
  }
`
const NoData = styled.div`
  align-items: center;
  color: ${props => props.theme.text3};
  display: flex;
  font-size: 15px;
  font-weight: 400;
  height: 340px;
  justify-content: center;
  letter-spacing: 0.4px;
  line-height: 1.3;
  padding-left: ${props => props.theme.cards.paddingHorizontal};
  padding-right: ${props => props.theme.cards.paddingHorizontal};
`

const AnEvenSmallerLittleBall = styled(OutcomeItemLittleBallOfJoyAndDifferentColors as any)`
  height: 8px;
  margin-right: 12px;
  width: 8px;
`

const AxisWrapper = styled.div`
  display: inline;
  stroke: ${props => props.theme.primary4};
  fill: ${props => props.theme.text4};
`

const toPercent = (decimal: number, fixed = 0) => {
  return `${(decimal * 100).toFixed(fixed)}%`
}
const renderTooltipContent = (o: any) => {
  const { label, payload } = o

  return (
    <ChartTooltip>
      <TooltipTitle>{label}</TooltipTitle>
      <Legends>
        {payload.reverse().map((entry: any, index: number) => (
          <Legend key={`item-${index}`}>
            <AnEvenSmallerLittleBall outcomeIndex={index} />
            <strong>{`${toPercent(entry.value)}`}</strong>
            {`- ${entry.name}`}
          </Legend>
        ))}
      </Legends>
    </ChartTooltip>
  )
}

//Demiurge
const candlesAppearance = {
  fill: function fill(d: { date: Date; open: number; high: number; low: number; close: number }) {
    return d.close > d.open ? '#0ECB81' : '#F6465D'
  },
  candleStrokeWidth: 1,
  widthRatio: 0.9,
  opacity: 1,
}

const ohlcTooltipAppearance = {
  fontFamily: 'Do Hyeon',
  fontSize: 14,
  fontWeight: 500,
  labelFill: '#fff',
  labelFontWeight: 200,
  textFill: '#fff',
}

const xAxisAppearance = {
  fontFamily: 'Do Hyeon',
  fontSize: 10,
  fontWeight: 500,
  showDomain: true,
  showTicks: true,
  showTickLabel: true,
  tickLabelFill: '#fff',
  ticks: 16,
  showGridLines: false,
  gridLinesStrokeStyle: '#9b9ea1',
  gridLinesStrokeWidth: 0.5,
  zoomEnabled: false,
  xZoomHeight: 10,
}

const yAxisAppearance = {
  fontFamily: 'Do Hyeon',
  fontSize: 10,
  fontWeight: 500,
  showDomain: true,
  showTicks: true,
  showTickLabel: true,
  tickLabelFill: '#fff',
  ticks: 10,
  showGridLines: false,
  gridLinesStrokeStyle: '#9b9ea1',
  gridLinesStrokeWidth: 0.5,
  zoomEnabled: false,
  yZoomWidth: 10,
}

const hoverTooltipAppearance = {
  fontSize: 14,
  fontFill: '#050505',
  background: {
    fillStyle: 'transparent',
    height: 50,
    strokeStyle: 'transparent',
    width: 10,
  },
}

const edgeIndicatorAppearance = {
  rectHeight: 1,
  rectWidth: 4,
  textFill: '#fff',
}

type Props = {
  //Demiurge
  ohlcFailureData: { date: Date; open: number; high: number; low: number; close: number }[]
  ohlcSuccessData: { date: Date; open: number; high: number; low: number; close: number }[]
  outcomes: string[]
  scalarHigh?: Maybe<BigNumber>
  scalarLow?: Maybe<BigNumber>
  unit: string
  isScalar?: Maybe<boolean>
  sharesDataLoader: boolean
  status: any
  notEnoughData: boolean
}

export const HistoryChart: React.FC<Props> = ({
  isScalar,
  notEnoughData,
  ohlcFailureData,
  ohlcSuccessData,
  outcomes,
  scalarHigh,
  scalarLow,
  sharesDataLoader,
  status,
  unit,
}) => {
  const history = useHistory()

  const toScaleValue = (decimal: number, fixed = 0) => {
    return `${calcPrediction(decimal.toString(), scalarLow || new BigNumber(0), scalarHigh || new BigNumber(0)).toFixed(
      fixed,
    )} ${unit}`
  }

  //Demiurge
  //console.log('ohlcSuccessData', ohlcSuccessData)
  //console.log('ohlcFailureData', ohlcFailureData)
  //Demiurge
  const margin = { left: 0, right: 48, top: 20, bottom: 24 }
  const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(d => new Date(d.date))
  const pricesDisplayFormat = format('.2f')
  const timeDisplayFormat = timeFormat('%m/%d/%Y %H:%M')
  const height = 300
  const ratio = 1
  const width = 550
  const ema12 = ema()
    .id(1)
    .options({ windowSize: 12 })
    .merge((d: any, c: any) => {
      d.ema12 = c
    })
    .accessor((d: any) => d.ema12)

  const ema26 = ema()
    .id(2)
    .options({ windowSize: 26 })
    .merge((d: any, c: any) => {
      d.ema26 = c
    })
    .accessor((d: any) => d.ema26)

  //SuccessData
  const { data: Sdata, displayXAccessor: SdisplayXAccessor, xAccessor: SxAccessor, xScale: SxScale } = xScaleProvider(
    ohlcSuccessData,
  )
  const Smax = SxAccessor(Sdata[Sdata.length - 1])
  const Smin = SxAccessor(Sdata[Math.max(0, Sdata.length - 100)])
  const SxExtents = [Smin, Smax + 5]

  //FailureData
  const { data: Fdata, displayXAccessor: FdisplayXAccessor, xAccessor: FxAccessor, xScale: FxScale } = xScaleProvider(
    ohlcFailureData,
  )
  const Fmax = FxAccessor(Fdata[Fdata.length - 1])
  const Fmin = FxAccessor(Fdata[Math.max(0, Fdata.length - 100)])
  const FxExtents = [Fmin, Fmax + 5]

  //Common Success Failure Data
  const gridHeight = height - margin.top - margin.bottom
  const barChartHeight = gridHeight / 4
  const chartHeight = gridHeight
  const yEdgeIndicator = (data: { date: Date; open: number; high: number; low: number; close: number }) => {
    return data.close
  }
  const openCloseColor = (data: { date: Date; open: number; high: number; low: number; close: number }) => {
    return data.close > data.open ? '#0ECB81' : '#F6465D'
  }

  if (!Sdata || !Fdata || status === 'Loading' || sharesDataLoader) {
    return <CustomInlineLoading message="Loading Trade History" />
  }
  if (notEnoughData) {
    return <NoData>There is not enough historical data for this market</NoData>
  }

  return (
    <>
      <ChartCanvas
        data={Sdata}
        defaultFocus={true}
        displayXAccessor={SdisplayXAccessor}
        height={height}
        margin={margin}
        ratio={ratio}
        seriesName="Data"
        width={width}
        xAccessor={SxAccessor}
        xExtents={SxExtents}
        xScale={SxScale}
        zoomAnchor={lastVisibleItemBasedZoomAnchor}
      >
        <Chart height={chartHeight} id={3} yExtents={[0, 1]}>
          <XAxis {...xAxisAppearance} />
          <YAxis {...yAxisAppearance} />
          <CandlestickSeries {...candlesAppearance} />
          <LineSeries strokeStyle={ema26.stroke()} yAccessor={ema26.accessor()} />
          <CurrentCoordinate fillStyle={ema26.stroke()} yAccessor={ema26.accessor()} />
          <LineSeries strokeStyle={ema12.stroke()} yAccessor={ema12.accessor()} />
          <CurrentCoordinate fillStyle={ema12.stroke()} yAccessor={ema12.accessor()} />
          <MouseCoordinateX displayFormat={timeDisplayFormat} />
          <MouseCoordinateY displayFormat={pricesDisplayFormat} rectWidth={margin.right} />
          <EdgeIndicator
            displayFormat={pricesDisplayFormat}
            fill={openCloseColor}
            itemType="last"
            lineStroke={openCloseColor}
            rectWidth={margin.right - 15}
            yAccessor={yEdgeIndicator}
          />
          <OHLCTooltip origin={[2, -5]} {...ohlcTooltipAppearance} />
          <HoverTooltip
            tooltip={{
              content: ({ currentItem, xAccessor }) => ({
                x: timeDisplayFormat(xAccessor(currentItem)),
                y: [
                  {
                    label: 'position',
                    value: 'SUCCESS',
                  },
                  {
                    label: 'open',
                    value: currentItem.open && currentItem.open.toFixed(2),
                  },
                  {
                    label: 'high',
                    value: currentItem.high && currentItem.high.toFixed(2),
                  },
                  {
                    label: 'low',
                    value: currentItem.low && currentItem.low.toFixed(2),
                  },
                  {
                    label: 'close',
                    value: currentItem.close && currentItem.close.toFixed(2),
                  },
                ],
              }),
            }}
            yAccessor={ema12.accessor()}
            {...hoverTooltipAppearance}
          />
        </Chart>
        <CrossHairCursor />
      </ChartCanvas>
      <ChartCanvas
        data={Fdata}
        defaultFocus={true}
        displayXAccessor={FdisplayXAccessor}
        height={height}
        margin={margin}
        ratio={ratio}
        seriesName="Data"
        width={width}
        xAccessor={FxAccessor}
        xExtents={FxExtents}
        xScale={FxScale}
        zoomAnchor={lastVisibleItemBasedZoomAnchor}
      >
        <Chart height={chartHeight} id={3} yExtents={[0, 1]}>
          <XAxis {...xAxisAppearance} />
          <YAxis {...yAxisAppearance} />
          <CandlestickSeries {...candlesAppearance} />
          <LineSeries strokeStyle={ema26.stroke()} yAccessor={ema26.accessor()} />
          <CurrentCoordinate fillStyle={ema26.stroke()} yAccessor={ema26.accessor()} />
          <LineSeries strokeStyle={ema12.stroke()} yAccessor={ema12.accessor()} />
          <CurrentCoordinate fillStyle={ema12.stroke()} yAccessor={ema12.accessor()} />
          <MouseCoordinateX displayFormat={timeDisplayFormat} />
          <MouseCoordinateY displayFormat={pricesDisplayFormat} rectWidth={margin.right} />
          <EdgeIndicator
            displayFormat={pricesDisplayFormat}
            fill={openCloseColor}
            itemType="last"
            lineStroke={openCloseColor}
            rectWidth={margin.right - 15}
            yAccessor={yEdgeIndicator}
          />
          <OHLCTooltip origin={[2, -5]} {...ohlcTooltipAppearance} />
          <HoverTooltip
            tooltip={{
              content: ({ currentItem, xAccessor }) => ({
                x: timeDisplayFormat(xAccessor(currentItem)),
                y: [
                  {
                    label: 'position',
                    value: 'FAILURE',
                  },
                  {
                    label: 'open',
                    value: currentItem.open && currentItem.open.toFixed(2),
                  },
                  {
                    label: 'high',
                    value: currentItem.high && currentItem.high.toFixed(2),
                  },
                  {
                    label: 'low',
                    value: currentItem.low && currentItem.low.toFixed(2),
                  },
                  {
                    label: 'close',
                    value: currentItem.close && currentItem.close.toFixed(2),
                  },
                ],
              }),
            }}
            yAccessor={ema12.accessor()}
            {...hoverTooltipAppearance}
          />
        </Chart>
        <CrossHairCursor />
      </ChartCanvas>
    </>
  )
}
