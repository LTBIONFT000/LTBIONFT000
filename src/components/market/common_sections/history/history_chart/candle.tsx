import classNames from 'classnames'
import React from 'react'

type Props = {
  data: { date: Date; open: number; high: number; low: number; close: number }
  candle_width: number
  pixelFor: (dollar: any) => number
  x: number
}

const Candle = (props: Props) => {
  const { candle_width, data, pixelFor, x } = props

  const up = data.close > data.open
  const bar_top = pixelFor(up ? data.close : data.open)
  const bar_bottom = pixelFor(up ? data.open : data.close)
  //Demiurge
  //minimal bar height must be > 0
  const bar_height = bar_bottom - bar_top + 0.1
  const wick_top = pixelFor(data.high)
  const wick_bottom = pixelFor(data.low)
  console.log('candle', up, bar_top, bar_bottom, bar_height, wick_top, wick_bottom)

  return (
    <>
      <rect
        className={classNames({
          candle: true,
          down: !up,
          up: up,
        })}
        height={bar_height}
        width={candle_width}
        x={x - candle_width / 2}
        y={bar_top}
      />
      <line
        className={classNames({
          wick: true,
          top: true,
          up: up,
          down: !up,
        })}
        x1={x}
        x2={x}
        y1={bar_top}
        y2={wick_top}
      />
      <line
        className={classNames({
          wick: true,
          bottom: true,
          up: up,
          down: !up,
        })}
        x1={x}
        x2={x}
        y1={bar_bottom}
        y2={wick_bottom}
      />
    </>
  )
}

export default Candle
