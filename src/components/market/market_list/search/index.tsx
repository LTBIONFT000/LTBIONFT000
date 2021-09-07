import React from 'react'
import styled from 'styled-components'

import { Textfield } from '../../../common'
import { IconSearchGrey } from '../../../common/icons'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  svg {
    position: absolute;
    left: 13px;
    top: 5px;
  }
`
const SearchTextField = styled(Textfield)`
  height: 30px;
  border-radius: 8px;
  border: 2px solid ${props => props.theme.colors.tertiary};
  padding-left: 45px;
  &:hover {
    background-color: ${props => props.theme.white};
    color: ${props => props.theme.colors.activeListItemBackground};
    //box-shadow: 0px 0px 4px 2px #f0b90b;
    &::placeholder {
      color: ${props => props.theme.textfield.backgroundColor};
      font-size: ${props => props.theme.textfield.placeholderFontSize};
      font-size: ${props => props.theme.textfield.placeholderFontWeight};
    }
  }
`

interface Props {
  onChange: (title: string) => void
  value: string
}

export const Search = (props: Props) => {
  const { onChange, value } = props

  return (
    <Wrapper>
      <IconSearchGrey />
      <SearchTextField
        onChange={e => onChange(e.target.value)}
        placeholder="Search Market (e.g. NCT, company, phase, indication)"
        value={value}
      />
    </Wrapper>
  )
}
