import React, { DOMAttributes } from 'react'
import styled from 'styled-components'

import { getOutcomeColor } from '../../../../../theme/utils'
const BarDiagramWrapper = styled.div`
  display: flex;
  min-width: 0px;
`

const Outcome = styled.div`
  flex-grow: 1;
`

const OutcomeText = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 0 0px;
`

const OutcomeName = styled.h2`
  color: ${props => props.theme.colors.textColor};
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0 0px 0 0;
  text-align: right;
  white-space: nowrap;
  border-radius: 2px;
  border-style: solid;
  border-width: 0px;
  display: flex;
  justify-content: center;
  outline: none;
  padding: 5px 8px;
  width: 80px;
`

const OutcomeValue = styled.p`
  color: ${props => props.theme.colors.gold};
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0 0px 0 0;
  text-align: right;
  white-space: nowrap;
  border-radius: 4px;
  border-style: solid;
  border-width: 0px;
  display: flex;
  justify-content: center;
  outline: none;
  padding: 5px 8px;
  width: 120px;
`

const ProgressBar = styled.div`
  display: none;
  background-color: #f5f5f5;
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
`

const Progress = styled.div<{ width: number; outcomeIndex: number; selected?: boolean }>`
  background-color: ${props =>
    getOutcomeColor(props.outcomeIndex).medium
      ? props.selected
        ? getOutcomeColor(props.outcomeIndex).darker
        : getOutcomeColor(props.outcomeIndex).medium
      : '#333'};
  border-radius: 4px;
  height: 100%;
  transition: width 0.25s ease-out, background-color 0.25s ease-out;
  width: ${props => props.width}%;
`

Progress.defaultProps = {
  outcomeIndex: 0,
  selected: false,
  width: 0,
}

interface Props extends DOMAttributes<HTMLDivElement> {
  outcomeIndex: number
  outcomeName?: string
  probability: number
  selected?: boolean
  winningBadge?: React.ReactNode
}

export const BarDiagram: React.FC<Props> = (props: Props) => {
  const { outcomeIndex, outcomeName, probability, selected, winningBadge } = props

  return (
    <BarDiagramWrapper>
      <Outcome>
        <OutcomeText>
          {outcomeName && <OutcomeName>{outcomeName}</OutcomeName>}
          {winningBadge}
          <OutcomeValue> 1 : {(100 / probability).toFixed(2)} </OutcomeValue>
        </OutcomeText>
        <ProgressBar>
          <Progress outcomeIndex={outcomeIndex} selected={selected} width={probability} />
        </ProgressBar>
      </Outcome>
    </BarDiagramWrapper>
  )
}
