import classNames from 'classnames'
import React, { useState } from 'react'

import Candle from './candle'
import CrossHairs from './crosshairs'

type Props = {
  data: { date: Date; open: number; high: number; low: number; close: number }[]
  width: number
  height: number
}

const Chart = (props: Props) => {
  const { data, height: chart_height, width: chart_width } = props
  // let { last_bar_idx = 0, bars_wide = 40 } = props;
  // last_bar_idx should default to the last bar in the data, or else be sure passed-in value doesn't exceed the last bar
  // last_bar_idx = last_bar_idx > 0 ? Math.min(last_bar_idx, data.length - 1) : data.length - 1;

  const [mouseCoords, setMouseCoords] = useState({
    x: 0,
    y: 0,
  })

  // let mouseCoords = {
  //   x: 0,
  //   y: 0
  // };

  // const setMouseCoords = (x, y) => {
  //   mouseCoords = { x, y };
  // };

  // find the high and low bounds of all the bars being sidplayed
  const dollar_high = Number(1)
  const dollar_low = Number(0)
  const chart_dims = {
    pixel_width: chart_width,
    pixel_height: chart_height,
    dollar_high,
    dollar_low,
    dollar_delta: dollar_high - dollar_low,
  }

  const dollarAt = (pixel: number) => {
    const dollar =
      (Math.abs(pixel - chart_dims.pixel_height) / chart_dims.pixel_height) * chart_dims.dollar_delta +
      chart_dims.dollar_low
    return pixel > 0 ? dollar.toFixed(2) : '-'
  }

  const pixelFor = (dollar: number) => {
    return Math.abs(
      ((dollar - chart_dims['dollar_low']) / chart_dims['dollar_delta']) * chart_dims['pixel_height'] -
        chart_dims['pixel_height'],
    )
  }

  const onMouseLeave = () => {
    setMouseCoords({
      x: 0,
      y: 0,
    })
  }

  //Demiurge
  const onMouseMoveInside = (e: React.MouseEvent<SVGSVGElement>) => {
    setMouseCoords({
      x: e.nativeEvent.x - Math.round(e.currentTarget.getBoundingClientRect().left),
      y: e.nativeEvent.y - Math.round(e.currentTarget.getBoundingClientRect().top),
    })
  }

  const onMouseClickInside = (e: React.MouseEvent<SVGSVGElement>) => {
    console.log(`Click at ${e.nativeEvent.offsetX}, ${e.nativeEvent.offsetY}`)
  }

  // calculate the candle width
  const candle_width = Math.floor((chart_width / data.length) * 0.7)

  return (
    <svg
      className="chart"
      height={chart_height}
      onClick={onMouseClickInside}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMoveInside}
      width={chart_width}
    >
      {data.map((bar, i) => {
        const candle_x = (chart_width / (data.length + 1)) * (i + 1)
        return <Candle candle_width={candle_width} data={bar} key={i} pixelFor={pixelFor} x={candle_x} />
      })}
      <text fill="white" fontSize="10" x="10" y="16">
        <tspan>
          Mouse: {mouseCoords.x}, {mouseCoords.y}
        </tspan>
        <tspan x="10" y="30">
          Dollars: ${dollarAt(mouseCoords.y)}
        </tspan>
      </text>
      <CrossHairs chart_dims={chart_dims} x={mouseCoords.x} y={mouseCoords.y} />
    </svg>
  )
}

export default Chart
