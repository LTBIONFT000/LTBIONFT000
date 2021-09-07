import React from 'react'
import styled from 'styled-components'

//Demiurge
const Wrapper = styled.div`
  align-items: center;
  display: none;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: nowrap;
`

export const SubsectionTitleWrapper: React.FC = props => {
  const { children, ...restProps } = props

  return <Wrapper {...restProps}>{children}</Wrapper>
}
