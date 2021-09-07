import classNames from 'classnames'
import React from 'react'

type Props = {
  x: number
  y: number
  chart_dims: {
    pixel_width: any
    pixel_height: any
    dollar_high: number
    dollar_low: number
    dollar_delta: number
  }
}

const CrossHairs = (props: Props) => {
  const { chart_dims, x, y } = props

  if (x + y === 0) {
    return <></>
  }

  return (
    <>
      <line
        className={classNames({
          cross_hair: true,
          horz: true,
        })}
        x1={0}
        x2={chart_dims.pixel_width}
        y1={y}
        y2={y}
      />
      <line
        className={classNames({
          cross_hair: true,
          vert: true,
        })}
        x1={x}
        x2={x}
        y1={0}
        y2={chart_dims.pixel_height}
      />
    </>
  )
}

export default CrossHairs
