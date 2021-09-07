import MailchimpMk from '@mailchimp/mailchimp_marketing'
import MailchimpTx from '@mailchimp/mailchimp_transactional'
import { Contract, Wallet as WalletE, ethers, utils } from 'ethers'
import { assertLeafType } from 'graphql'
import { borderColor } from 'polished'
import React, { ChangeEvent, HTMLAttributes, useCallback, useEffect, useState } from 'react'
import Modal from 'react-modal'
import styled, { css, withTheme } from 'styled-components'
import { useWeb3Context } from 'web3-react'

import connectors from '../../../util/connectors'
import { getLogger } from '../../../util/logger'
import { Wallet } from '../../../util/types'
import { Button } from '../../button'
import { ButtonType } from '../../button/button_styling_types'
import { FormRow, Spinner, Textfield } from '../../common'
import { IconArrowBack, IconArrowRightLong, IconClose, IconMRNAX } from '../../common/icons'
import { WarningMessage } from '../../market/common_sections/message_text/warning_message'
import { ContentWrapper, ModalNavigation } from '../common_styled'

import MetaMaskSVG from './img/metamask.svg'
import WalletConnectSVG from './img/wallet_connect.svg'

const logger = getLogger('ModalConnectWallet::Index')

//Demiurge
const mailchimp = new MailchimpTx('rlsRs2XQRJoZ2w6FEpPW1g')
const emailValidator = new RegExp(
  /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
)
type EmailListInfo = {
  created_at: string
  detail: string
  email: string
}
const addUser = async (newUser: string) => {
  const response = await mailchimp.whitelists.add({
    email: newUser,
  })
  console.log(response)
}
const checkUser = async (user: string) => {
  const response: EmailListInfo[] = await mailchimp.whitelists.list()
  console.log(response.filter(existingUser => existingUser.email === user)[0])
  if (response.filter(existingUser => existingUser.email === user)[0]) {
    console.log('already exists')
  } else {
    addUser(user)
  }
}

const HeaderText = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.textColorDark};
  margin-top: 16px;
  margin-bottom: 48px;
`

const Buttons = styled.div`
  margin-top: auto;
  width: 100%;

  &:last-child {
    margin-top: 0;
  }
`

const ButtonStyled = styled(Button)`
  width: 100%;
  border: none;
  border-bottom: 1px solid ${props => props.theme.buttonPrimaryLine.borderColor};
  border-radius: 0;
  height: 60px;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: space-between;

  &[disabled] {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .arrow-path {
    transition: 0.2s fill;
  }

  &:hover {
    border-bottom: 1px solid ${props => props.theme.buttonPrimaryLine.borderColor};
    background: ${props => props.theme.colors.mainBodyBackground};

    .arrow-path {
      fill: ${props => props.theme.colors.mainBodyBackground};
    }
  }

  &:first-child {
    border-top: 1px solid ${props => props.theme.buttonPrimaryLine.borderColor};

    &:hover {
      border-top: 1px solid ${props => props.theme.buttonPrimaryLine.borderColor};
    }
  }
`
//Demiurge

const SecretPhraseButtonStyled = styled(Button)`
  width: 100%;
  border-top: 3px solid ${props => props.theme.colors.white};
  border-radius: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textColor};
  background: ${props => props.theme.colors.mainBodyBackground};
  &:hover {
    border: 3px solid ${props => props.theme.colors.gold};
    background: ${props => props.theme.colors.white};
    box-shadow: 0px 0px 4px 2px #f0b90b;
    color: ${props => props.theme.colors.mainBodyBackground};

    .arrow-path {
      fill: ${props => props.theme.colors.mainBodyBackground};
    }
  }
`
const WarningMessageStyled = styled(WarningMessage)`
  margin: 0 0 0 0;
  padding: 4px 16px;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
  white-space: pre-line;
`
const SecretPhraseStyled = styled(Button)`
  background-color: ${props => props.theme.colors.white};
  white-space: normal;
  font-size: 2.7vw;
  letter-spacing: 0.5px;
  line-height: 30px;
  overflow-wrap: normal;
  border: 3px solid ${props => props.theme.colors.gold};
  border-radius: 0;
  height: 120px;
  width: auto;
  cursor: pointer;
  color: ${props => props.theme.colors.mainBodyBackground};
  box-shadow: 0px 0px 4px 2px #f0b90b;
  font-family: 'Do Hyeon';
  &:hover {
    border: 3px solid ${props => props.theme.colors.gold};
    background: ${props => props.theme.colors.white};

    color: ${props => props.theme.colors.mainBodyBackground};
  }
`
const FormStyled = styled.form`
  width: 100%;
  border: 2px solid ${props => props.theme.buttonPrimaryLine.borderColor};
  border-radius: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const SearchTextField = styled(Textfield)`
  width: 100%;
  border: 3px solid ${props => props.theme.colors.gold};
  border-radius: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover {
    background-color: ${props => props.theme.activeListItemBackground};
    border-color: ${props => props.theme.colors.gold};
    color: ${props => props.theme.textColor};
    box-shadow: 0px 0px 4px 2px #f0b90b;
  }
`

const ButtonLeft = styled.div`
  display: flex;
  align-items: center;
`

const Icon = css`
  background-position: 50% 50%;
  background-repeat: no-repeat;
  background-size: contain;
  display: block;
  height: 22px;
  margin: 0 15px 0 0;
  width: 22px;
`

const IconMetaMask = styled.span`
  ${Icon}
  background-image: url('${MetaMaskSVG}');
`

const IconWalletConnect = styled.span`
  ${Icon}
  background-image: url('${WalletConnectSVG}');
`

const Text = styled.span`
  color: ${props => props.theme.colors.textColor};
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0;
`

const ConnectingText = styled.p`
  color: ${props => props.theme.colors.textColor};
  font-size: 14px;
  font-weight: normal;
  letter-spacing: 0.4px;
  line-height: 1.5;
  margin: 0;
  padding: 30px 0 0;
  text-align: center;
`

interface ButtonProps {
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
  text: string
}

const ConnectButton = (props: ButtonProps) => {
  const { disabled, icon, onClick, text } = props

  return (
    <ButtonStyled buttonType={ButtonType.secondaryLine} disabled={disabled} onClick={onClick}>
      <ButtonLeft>
        {icon}
        <Text>{text}</Text>
      </ButtonLeft>
      <IconArrowRightLong />
    </ButtonStyled>
  )
}

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  theme?: any
  placeholder: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => any
}

export const ModalConnectWallet = (props: Props) => {
  const context = useWeb3Context()
  const mnemonic = 'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol'
  const [connectingToWalletConnect, setConnectingToWalletConnect] = useState(false)
  const [connectingToMetamask, setConnectingToMetamask] = useState(false)
  const [newWallet, setNewWallet] = useState(WalletE.fromMnemonic(mnemonic))
  const { isOpen, onClose, theme } = props

  //Demiurge
  const { onChange, placeholder = 'Type your email...' } = props
  let { value } = props
  const [showingEnterEmailAddress, setShowingEnterEmailAddress] = useState(false)
  const [isWalletConnectDisabled, setIsWalletConnectDisabled] = useState(false)
  const [isMetaMaskDisabled, setIsMetaMaskDisabled] = useState(false)
  const [isCreateNewWalletDisabled, setIsCreateNewWalletDisabled] = useState(false)
  const [isShowingSeedPhrase, setIsShowingSeedPhrase] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const toggleEmailField = () => {
    setShowingEnterEmailAddress(!showingEnterEmailAddress)
  }

  const isMetamaskEnabled = 'ethereum' in window || 'web3' in window
  const onClickWallet = (wallet: Wallet) => {
    if (wallet === Wallet.WalletConnect) {
      //Demiurge
      console.log('wallet', wallet)
      setIsWalletConnectDisabled(true)
      setIsMetaMaskDisabled(false)
      setIsCreateNewWalletDisabled(false)
      setShowingEnterEmailAddress(!showingEnterEmailAddress)
    }
    if (wallet === Wallet.MetaMask) {
      //Demiurge
      console.log('wallet', wallet)
      setIsMetaMaskDisabled(true)
      setIsWalletConnectDisabled(false)
      setIsCreateNewWalletDisabled(false)
      setShowingEnterEmailAddress(!showingEnterEmailAddress)
    }
    if (wallet === Wallet.CreateNewWallet) {
      //Demiurge
      console.log('wallet', wallet)
      console.log('newWallet', newWallet)
      setIsCreateNewWalletDisabled(true)
      setIsWalletConnectDisabled(false)
      setIsMetaMaskDisabled(false)
      setShowingEnterEmailAddress(!showingEnterEmailAddress)
    }
  }

  const showSecretPhrase = (e: void) => {
    setIsShowingSeedPhrase(true)
    setIsCreateNewWalletDisabled(false)
  }

  const UserWallet = (wallet: Wallet, e: void) => {
    if (wallet === Wallet.WalletConnect) {
      if (emailValidator.test(value)) {
        //Demiurge
        checkUser(value)
        setConnectingToWalletConnect(true)
        context.setConnector(wallet)
        localStorage.setItem('CONNECTOR', wallet)
        return true
      } else {
        alert('Email validation failed. Please try again.')
        return false
      }
    }
    if (wallet === Wallet.MetaMask) {
      if (emailValidator.test(value)) {
        //Demiurge
        checkUser(value)
        setConnectingToMetamask(true)
        context.setConnector(wallet)
        localStorage.setItem('CONNECTOR', wallet)
        return true
      } else {
        alert('Email validation failed. Please try again.')
        return false
      }
    }
    if (wallet === Wallet.CreateNewWallet) {
      if (emailValidator.test(value)) {
        //Demiurge
        checkUser(value)
        setIsCreatingWallet(true)
        setShowingEnterEmailAddress(false)
        setNewWallet(WalletE.createRandom())
        //console.log('newWallet', newWallet)
        //prompt to remember private key that's shown once
        //const mnemonic = 'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol'
        //setNewWallet(WalletE.fromMnemonic(mnemonic))
      } else {
        alert('Email validation failed. Please try again.')
        return false
      }
    }
  }

  if (context.error) {
    logger.error('Error in web3 context', context.error)
    localStorage.removeItem('CONNECTOR')
    onClose()
  }

  const resetEverything = useCallback(() => {
    setConnectingToWalletConnect(false)
    setConnectingToMetamask(false)
  }, [])

  const onClickCloseButton = useCallback(() => {
    resetEverything() // we need to do this or the states and functions will keep executing even when the modal is closed by the user
    onClose()
  }, [onClose, resetEverything])
  useEffect(() => {
    if (connectingToWalletConnect) {
      connectors.WalletConnect.connect.onConnect(() => onClickCloseButton())
      connectors.WalletConnect.onError = () => onClickCloseButton()
    }
    if (connectingToWalletConnect && context.account && context.connectorName === Wallet.WalletConnect) {
      onClickCloseButton()
      setConnectingToWalletConnect(false)
    }
  }, [context, onClickCloseButton, connectingToWalletConnect])
  useEffect(() => {
    if (connectingToMetamask && context.account && context.connectorName === Wallet.MetaMask) {
      onClickCloseButton()
      setConnectingToMetamask(false)
    }
  }, [context, onClickCloseButton, connectingToMetamask])

  const isConnectingToWallet = connectingToMetamask || connectingToWalletConnect
  let connectingText = `Connecting to wallet`
  if (connectingToMetamask) {
    connectingText = 'Requesting permission on Metamask'
  }
  if (connectingToWalletConnect) {
    connectingText = 'Opening QR for Wallet Connect'
  }

  const disableMetamask: boolean = !isMetamaskEnabled || false
  const disableWalletConnect = false

  React.useEffect(() => {
    Modal.setAppElement('#root')
  }, [])

  return (
    <>
      <Modal
        isOpen={!context.account && isOpen && !connectingToWalletConnect}
        onRequestClose={onClickCloseButton}
        shouldCloseOnOverlayClick={!isConnectingToWallet}
        style={{ ...theme.fixedHeightModal, content: { ...theme.fluidHeightModal.content, minHeight: '510px' } }}
      >
        <ContentWrapper>
          <ModalNavigation>
            {isConnectingToWallet ? <IconArrowBack hoverEffect={true} onClick={resetEverything} /> : <div></div>}
            <IconClose hoverEffect={true} onClick={onClickCloseButton} />
          </ModalNavigation>
          <IconMRNAX dropShadow id="connectWallet" size={150} />
          <HeaderText>{isConnectingToWallet ? 'Unlock Wallet' : 'Connect a Wallet'}</HeaderText>
          {isConnectingToWallet ? (
            <>
              <Spinner big={true} />
              <ConnectingText>{connectingText}</ConnectingText>
            </>
          ) : (
            <>
              <Buttons>
                <div>
                  <ConnectButton
                    disabled={disableMetamask}
                    icon={<IconMetaMask />}
                    onClick={() => {
                      onClickWallet(Wallet.MetaMask)
                    }}
                    text="Metamask"
                  />
                  {showingEnterEmailAddress && isMetaMaskDisabled && (
                    <div>
                      <FormStyled onSubmit={e => UserWallet(Wallet.MetaMask)}>
                        <SearchTextField
                          autoComplete="off"
                          name={'Email'}
                          onChange={e => (value = e.target.value)}
                          placeholder={'Please enter email address here:'}
                          type="text"
                        />
                      </FormStyled>
                    </div>
                  )}
                </div>
                <div>
                  <ConnectButton
                    disabled={disableWalletConnect}
                    icon={<IconWalletConnect />}
                    onClick={() => {
                      onClickWallet(Wallet.WalletConnect)
                    }}
                    text="Wallet Connect"
                  />
                  {showingEnterEmailAddress && isWalletConnectDisabled && (
                    <div>
                      <FormStyled onSubmit={e => UserWallet(Wallet.WalletConnect)}>
                        <SearchTextField
                          autoComplete="off"
                          name={'Email'}
                          onChange={e => (value = e.target.value)}
                          placeholder={'Please enter email address here:'}
                          type="text"
                        />
                      </FormStyled>
                    </div>
                  )}
                </div>
                <div>
                  <ConnectButton
                    disabled={disableWalletConnect}
                    icon={<IconWalletConnect />}
                    onClick={() => {
                      onClickWallet(Wallet.CreateNewWallet)
                    }}
                    text="Use Email Address to Create Your Wallet"
                  />
                  {showingEnterEmailAddress && isCreateNewWalletDisabled && (
                    <div>
                      <FormStyled onSubmit={e => UserWallet(Wallet.CreateNewWallet, e.preventDefault())}>
                        <SearchTextField
                          autoComplete="off"
                          name={'Email'}
                          onChange={e => (value = e.target.value)}
                          placeholder={'Please enter email address here:'}
                          type="text"
                        />
                      </FormStyled>
                    </div>
                  )}
                  {isCreatingWallet && isCreateNewWalletDisabled && (
                    <div>
                      <WarningMessageStyled description="Your new wallet has been created and ready for safe use." />
                      <WarningMessageStyled description="Please click the following button to reveal your Secret Recovery Phrase and keep it safe." />
                      <WarningMessageStyled description="WARNING: Never disclose your Secret Recovery Phrase. Anyone with this phrase can take your assets forever." />
                      <div>
                        <SecretPhraseButtonStyled
                          onClick={e => showSecretPhrase(e.preventDefault())}
                          onKeyDown={e => showSecretPhrase(e.preventDefault())}
                        >
                          CLICK HERE TO REVEAL SECRET RECOVERY PHRASE
                        </SecretPhraseButtonStyled>
                      </div>
                    </div>
                  )}
                  {isShowingSeedPhrase && (
                    <div>
                      <SecretPhraseStyled>{newWallet.mnemonic}</SecretPhraseStyled>
                      <div>
                        <WarningMessageStyled description="ATTENTION: The Secret Recovery Phrase will SELF-DESTROY after being revealed ONCE to you." />
                        <WarningMessageStyled description="Please write down your Secret Recovery Phrase NOW." />
                        <WarningMessageStyled description="You can start using your wallet by importing your Secret Recovery Phrase to Metamask." />
                        <WarningMessageStyled description="WARNING: There is NO way to retrieve your lost Secret Recovery Phrase because our server NEVER stores it." />
                      </div>
                    </div>
                  )}
                </div>
              </Buttons>
            </>
          )}
        </ContentWrapper>
      </Modal>
    </>
  )
}

export const ModalConnectWalletWrapper = withTheme(ModalConnectWallet)
