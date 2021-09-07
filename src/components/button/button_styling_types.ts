import { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { css } from 'styled-components'

export enum ButtonType {
  primary,
  primaryLine,
  secondary,
  secondaryLine,
  buySecondaryLine,
  sellSecondaryLine,
}

export interface ButtonCommonProps {
  buttonType?: ButtonType
  theme?: any
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonCommonProps {}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, ButtonCommonProps {}

const PrimaryCSS = css`
  & {
    background-color: ${props => props.theme.primary1};
    border-color: ${props => props.theme.primary1};
    color: ${props => props.theme.white};
  }

  &:hover {
    background-color: ${props => props.theme.primary3};
    border-color: ${props => props.theme.primary3};
    color: ${props => props.theme.white};
  }

  &[disabled],
  &[disabled]:hover {
    background-color: ${props => props.theme.white};
    border-color: ${props => props.theme.primary4};
    color: ${props => props.theme.text2};
    cursor: not-allowed;
  }
`

const PrimaryLineCSS = css`
  & {
    background-color: ${props => props.theme.black};
    border-color: ${props => props.theme.black};
    color: ${props => props.theme.black};
  }

  &:hover {
    background-color: ${props => props.theme.white};
    border-color: ${props => props.theme.border2};
    color: ${props => props.theme.text1};
  }

  &[disabled],
  &[disabled]:hover {
    background-color: ${props => props.theme.white};
    border-color: ${props => props.theme.primary4};
    color: ${props => props.theme.text1};
    cursor: not-allowed;
  }
`

const SecondaryCSS = css`
  & {
    background-color: ${props => props.theme.white};
    border-color: ${props => props.theme.white};
    color: ${props => props.theme.primary3};
    font-weight: ${props => props.theme.buttonSecondary.weight};
  }

  &:hover {
    background-color: ${props => props.theme.white};
    border-color: ${props => props.theme.white};
    color: ${props => props.theme.primary3};
    box-shadow: 0px 0px 4px 2px #fff;
  }

  &[disabled],
  &[disabled]:hover {
    background-color: ${props => props.theme.white};
    border-color: ${props => props.theme.white};
    color: ${props => props.theme.primary3};
    cursor: not-allowed;
  }
`

const SecondaryLineCSS = css`
  & {
    background-color: ${props => props.theme.colors.activeListItemBackground};
    border-color: ${props => props.theme.white};
    color: ${props => props.theme.white};
    border-width: 2px;
  }

  &:hover {
    background-color: ${props => props.theme.activeListItemBackground};
    border-color: ${props => props.theme.white};
    color: ${props => props.theme.textColor};
    box-shadow: 0px 0px 4px 2px #fff;
  }

  &[disabled],
  &[disabled]:hover {
    background-color: ${props => props.theme.activeListItemBackground};
    border-color: ${props => props.theme.white};
    color: ${props => props.theme.white};
    cursor: not-allowed;
  }
`
//Demiurge
const BuySecondaryLineCSS = css`
  & {
    background-color: ${props => props.theme.green};
    border-color: ${props => props.theme.green};
    color: ${props => props.theme.text1};
    width: 100px;
  }

  &:hover {
    background-color: ${props => props.theme.green};
    border-color: ${props => props.theme.green};
    color: ${props => props.theme.text1};
    width: 100px;
  }

  &[disabled],
  &[disabled]:hover {
    background-color: ${props => props.theme.green};
    border-color: ${props => props.theme.green};
    color: ${props => props.theme.text2};
    cursor: not-allowed;
    width: 100px;
  }
`

const SellSecondaryLineCSS = css`
  & {
    background-color: ${props => props.theme.red};
    border-color: ${props => props.theme.red};
    color: ${props => props.theme.text1};
    width: 100px;
  }

  &:hover {
    background-color: ${props => props.theme.red};
    border-color: ${props => props.theme.red};
    color: ${props => props.theme.text1};
    width: 100px;
  }

  &[disabled],
  &[disabled]:hover {
    background-color: ${props => props.theme.red};
    border-color: ${props => props.theme.red};
    color: ${props => props.theme.text2};
    cursor: not-allowed;
    width: 100px;
  }
`

const getButtonTypeStyles = (buttonType: ButtonType = ButtonType.primaryLine): any => {
  if (buttonType === ButtonType.primary) {
    return PrimaryCSS
  }

  if (buttonType === ButtonType.secondary) {
    return SecondaryCSS
  }

  if (buttonType === ButtonType.primaryLine) {
    return PrimaryLineCSS
  }

  if (buttonType === ButtonType.secondaryLine) {
    return SecondaryLineCSS
  }

  //Demiurge
  if (buttonType === ButtonType.buySecondaryLine) {
    return BuySecondaryLineCSS
  }

  if (buttonType === ButtonType.sellSecondaryLine) {
    return SellSecondaryLineCSS
  }
  return PrimaryCSS
}

export const ButtonCSS = css`
  align-items: center;
  border-radius: 4px;
  border-style: solid;
  border-width: 0px;
  cursor: pointer;
  display: flex;
  font-size: ${({ theme }) => theme.fonts.defaultSize};
  line-height: ${({ theme }) => theme.fonts.defaultLineHeight};
  font-weight: 500;
  height: 40px;
  justify-content: center;
  letter-spacing: 0.5px;
  outline: none;
  padding: 12px 16px;
  pointer-events: ${props => ((props as any).disabled ? 'none' : 'initial')};
  text-align: center;
  transition: all 0.15s ease-out;
  user-select: none;
  white-space: nowrap;
  font-family: 'Do Hyeon';

  ${props => getButtonTypeStyles((props as any).buttonType)}
`
