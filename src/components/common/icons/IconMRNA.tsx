import React from 'react'
import styled from 'styled-components'

interface Props {
  style?: any
  size?: number
  dropShadow?: boolean
  id?: string
}

const SvgStyling = styled.svg<{ dropShadow?: boolean }>`
  ${props => props.dropShadow && 'filter: drop-shadow(0px 2px 4px rgba(13, 71, 161, 0.25));'};
`

export const IconMRNA = (props: Props) => {
  const { dropShadow, id = '', size = 22, style } = props
  return (
    <SvgStyling
      dropShadow={dropShadow}
      fill="none"
      height={size}
      style={style}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="#000000" stroke="none" transform="translate(20.000000,60.000000) scale(0.100000,-0.100000)">
        <path
          d="M172 559 c-65 -32 -99 -66 -135 -133 -17 -33 -22 -58 -22 -126 0 -73
          4 -92 27 -136 91 -174 324 -210 465 -72 120 118 116 310 -8 422 -92 83 -217
          100 -327 45z m197 -25 c29 -24 54 -79 44 -96 -2 -5 -17 -8 -33 -8 -22 0 -32 7
          -42 27 -24 50 -78 38 -78 -16 0 -27 0 -27 73 -27 l72 1 0 -34 0 -33 -105 0
          -105 0 0 77 c0 74 1 78 33 106 43 39 98 40 141 3z m-41 -86 c-7 -20 -48 -23
          -48 -4 0 11 9 16 26 16 16 0 24 -5 22 -12z m62 -153 l0 -35 -90 0 -90 0 0 28
          c0 16 3 32 7 35 3 4 44 7 90 7 l83 0 0 -35z m-50 -120 c0 -61 3 -75 16 -75 10
          0 14 -7 12 -22 -3 -21 -8 -23 -68 -23 -60 0 -65 2 -68 22 -2 16 2 23 12 23 13
          0 16 14 16 75 l0 75 40 0 40 0 0 -75z"
        />
      </g>
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id={`${id}omn`} x1="24" x2="24" y2="48">
          <stop offset="0" stopColor="#1565C0" />
          <stop offset="1" stopColor="#1976D2" />
        </linearGradient>
      </defs>
    </SvgStyling>
  )
}
