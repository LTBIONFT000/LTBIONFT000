import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  border: ${({ theme }) => theme.borders.borderLineDisabled};
  background-color: ${props => props.theme.colors.mainBodyBackground};
  padding: 21px;
  background-position: bottom left;
  background-size: 2.5% auto;
  background-repeat: repeat-x;

  @media (max-width: ${props => props.theme.themeBreakPoints.md}) {
    background-size: 2% auto;
  }
`

export const TransactionDetailsCard: React.FC = props => {
  const { children, ...restProps } = props

  return <Wrapper {...restProps}>{children}</Wrapper>
}
