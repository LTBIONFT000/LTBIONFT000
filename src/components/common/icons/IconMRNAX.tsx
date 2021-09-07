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

export const IconMRNAX = (props: Props) => {
  const { dropShadow, id = '', size = 50, style } = props
  return (
    <svg fill="none" height="30%" viewBox="0 0 67 40" width="50%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <g>
          <symbol id="glyph0-0" overflow="visible">
            <path
              d="M 8.429688 -9.253906 L 6.582031 -9.253906 C 6.558594 -9.253906 6.488281 -9.242188 6.476562 -9.21875 L 4.289062 -6.128906 L 3.320312 -7.484375 L 1.167969 -7.484375 C 1.851562 -6.523438 2.519531 -5.5625 3.203125 -4.625 L 0.0351562 -0.171875 C -0.0351562 -0.09375 0.0117188 0 0.128906 0 L 1.976562 0 C 2 0 2.070312 -0.0117188 2.082031 -0.0351562 L 4.289062 -3.121094 L 5.25 -1.769531 L 7.402344 -1.769531 C 6.71875 -2.730469 6.039062 -3.6875 5.355469 -4.625 L 8.546875 -9.078125 C 8.605469 -9.160156 8.558594 -9.253906 8.429688 -9.253906 Z M 8.429688 -9.253906 "
              stroke="none"
            />
          </symbol>
          <symbol id="glyph1-0" overflow="visible">
            <path
              d="M 2.964844 -7.941406 C 2.964844 -8.328125 3.222656 -8.585938 3.683594 -8.585938 C 4.089844 -8.585938 4.316406 -8.375 4.390625 -8.042969 L 5.828125 -1.859375 C 6.128906 -0.554688 6.859375 0.179688 8.269531 0.179688 C 9.664062 0.179688 10.351562 -0.523438 10.667969 -1.859375 L 12.121094 -8.042969 C 12.195312 -8.375 12.402344 -8.585938 12.824219 -8.585938 C 13.289062 -8.585938 13.542969 -8.328125 13.542969 -7.941406 L 13.542969 0 L 15.296875 0 L 15.296875 -8.03125 C 15.296875 -9.378906 14.5 -10.292969 12.867188 -10.292969 C 11.414062 -10.292969 10.667969 -9.574219 10.382812 -8.300781 L 8.957031 -2.113281 C 8.867188 -1.753906 8.660156 -1.542969 8.285156 -1.542969 C 7.910156 -1.542969 7.699219 -1.753906 7.609375 -2.113281 L 6.1875 -8.300781 C 5.902344 -9.574219 5.078125 -10.292969 3.640625 -10.292969 C 2.007812 -10.292969 1.214844 -9.378906 1.214844 -8.03125 L 1.214844 0 L 2.964844 0 Z M 2.964844 -7.941406 "
              stroke="none"
            />
          </symbol>
          <symbol id="glyph1-1" overflow="visible">
            <path
              d="M 1.199219 -10.113281 L 1.199219 -8.34375 L 6.742188 -8.34375 C 7.714844 -8.34375 8.148438 -7.730469 8.148438 -7.011719 C 8.148438 -6.292969 7.746094 -5.601562 6.742188 -5.601562 L 2.800781 -5.601562 C 1.691406 -5.601562 1.214844 -5.136719 1.214844 -4 L 1.214844 0 L 2.980469 0 L 2.980469 -3.65625 C 2.980469 -3.835938 3.070312 -3.910156 3.234375 -3.910156 L 5.871094 -3.910156 L 8.179688 0 L 10.140625 0 L 7.789062 -4.042969 C 9.332031 -4.480469 9.933594 -5.828125 9.933594 -7.085938 C 9.933594 -8.703125 8.957031 -10.113281 6.679688 -10.113281 Z M 1.199219 -10.113281 "
              stroke="none"
            />
          </symbol>
          <symbol id="glyph1-2" overflow="visible">
            <path
              d="M 2.980469 -8 C 2.980469 -8.359375 3.191406 -8.585938 3.59375 -8.585938 C 3.910156 -8.585938 4.089844 -8.449219 4.226562 -8.148438 L 7.175781 -1.691406 C 7.59375 -0.539062 8.238281 0.179688 9.648438 0.179688 C 11.207031 0.179688 11.96875 -0.703125 11.96875 -2.039062 L 11.96875 -10.113281 L 10.1875 -10.113281 L 10.1875 -2.113281 C 10.1875 -1.769531 9.960938 -1.542969 9.585938 -1.542969 C 9.257812 -1.542969 9.0625 -1.722656 8.945312 -1.960938 L 5.992188 -8.417969 C 5.574219 -9.574219 4.945312 -10.292969 3.535156 -10.292969 C 1.960938 -10.292969 1.214844 -9.40625 1.214844 -8.089844 L 1.214844 0 L 2.980469 0 Z M 2.980469 -8 "
              stroke="none"
            />
          </symbol>
          <symbol id="glyph1-3" overflow="visible">
            <path
              d="M 5.4375 -8.132812 C 5.542969 -8.375 5.707031 -8.480469 5.949219 -8.480469 C 6.1875 -8.480469 6.351562 -8.375 6.441406 -8.132812 L 9.511719 0 L 11.476562 0 L 8.058594 -8.988281 C 7.699219 -9.933594 7.011719 -10.292969 5.960938 -10.292969 C 4.898438 -10.292969 4.210938 -9.933594 3.835938 -8.988281 L 0.285156 0 L 2.230469 0 Z M 5.4375 -8.132812 "
              stroke="none"
            />
          </symbol>
        </g>
      </defs>
      <g id="surface1">
        <g fill="rgb(96.469116%,69.018555%,15.289307%)" fillOpacity="1">
          <use href="#glyph0-0" x="57.500868" y="23.162378" />
        </g>
        <g fill="rgb(100%,100%,100%)" fillOpacity="1">
          <use href="#glyph1-0" x="1.386337" y="29.128037" />
        </g>
        <g fill="rgb(100%,100%,100%)" fillOpacity="1">
          <use href="#glyph1-1" x="19.057498" y="29.128037" />
        </g>
        <g fill="rgb(100%,100%,100%)" fillOpacity="1">
          <use href="#glyph1-2" x="31.314457" y="29.287121" />
        </g>
        <g fill="rgb(100%,100%,100%)" fillOpacity="1">
          <use href="#glyph1-3" x="45.39753" y="29.128037" />
        </g>
      </g>
    </svg>
  )
}
