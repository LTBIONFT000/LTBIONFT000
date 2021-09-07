import {
  DEFAULT_ARBITRATOR,
  DEFAULT_AUTHORIZED_MARKET_HOST_RINKEBY,
  DEFAULT_LIQUIDITY_PROTECTION_DEMANDFROM_ADDRESS_RINKEBY,
  EARLIEST_MAINNET_BLOCK_TO_CHECK,
  EARLIEST_RINKEBY_BLOCK_TO_CHECK,
  GRAPH_MAINNET_HTTP,
  GRAPH_MAINNET_WS,
  GRAPH_RINKEBY_HTTP,
  GRAPH_RINKEBY_WS,
  GRAPH_SOKOL_HTTP,
  GRAPH_SOKOL_WS,
  GRAPH_XDAI_HTTP,
  GRAPH_XDAI_WS,
  INFURA_PROJECT_ID,
  KLEROS_CURATE_GRAPH_MAINNET_HTTP,
  KLEROS_CURATE_GRAPH_MAINNET_WS,
  KLEROS_CURATE_GRAPH_RINKEBY_HTTP,
  KLEROS_CURATE_GRAPH_RINKEBY_WS,
} from '../common/constants'
import { entries, isNotNull } from '../util/type-utils'

import { getImageUrl } from './token'
import { Arbitrator, Token } from './types'

export type NetworkId = 1 | 4 | 77 | 100

export const networkIds = {
  MAINNET: 1,
  RINKEBY: 4,
  SOKOL: 77,
  XDAI: 100,
} as const

export const networkNames = {
  1: 'MAINNET',
  4: 'RINKEBY',
  77: 'SOKOL',
  100: 'XDAI',
} as const

type CPKAddresses = {
  masterCopyAddress: string
  proxyFactoryAddress: string
  multiSendAddress: string
  fallbackHandlerAddress: string
}

interface Network {
  label: string
  url: string
  alternativeUrls: { [key: string]: string }[]
  graphHttpUri: string
  graphWsUri: string
  klerosCurateGraphHttpUri: string
  klerosCurateGraphWsUri: string
  realitioTimeout: number
  earliestBlockToCheck: number
  omenTCRListId: number
  contracts: {
    realitio: string
    realitioScalarAdapter: string
    marketMakerFactory: string
    conditionalTokens: string
    oracle: string
    klerosBadge: string
    klerosTokenView: string
    klerosTCR: string
    dxTCR: string
    lpsd: string
    omenVerifiedMarkets: string
  }
  cpk?: CPKAddresses
  relayProxyFactoryAddress?: string
  wrapToken: string
  targetSafeImplementation: string
  nativeAsset: Token
  defaultToken?: string
  blockExplorer: string
  blockExplorerURL: string
}

type KnownContracts = keyof Network['contracts']

interface KnownTokenData {
  symbol: string
  decimals: number
  addresses: {
    [K in NetworkId]?: string
  }
  order: number
  disabled?: boolean
  name?: string
}

export const pseudoNativeAssetAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const networks: { [K in NetworkId]: Network } = {
  [networkIds.MAINNET]: {
    label: 'Mainnet',
    url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    alternativeUrls: [
      {
        rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        name: 'Infura',
      },
      { rpcUrl: 'https://cloudflare-eth.com/', name: 'Cloudflare' },
    ],
    graphHttpUri: GRAPH_MAINNET_HTTP,
    graphWsUri: GRAPH_MAINNET_WS,
    klerosCurateGraphHttpUri: KLEROS_CURATE_GRAPH_MAINNET_HTTP,
    klerosCurateGraphWsUri: KLEROS_CURATE_GRAPH_MAINNET_WS,
    realitioTimeout: 86400,
    earliestBlockToCheck: EARLIEST_MAINNET_BLOCK_TO_CHECK,
    omenTCRListId: 3,
    contracts: {
      realitio: '0x325a2e0f3cca2ddbaebb4dfc38df8d19ca165b47',
      realitioScalarAdapter: '0xaa548EfBb0972e0c4b9551dcCfb6B787A1B90082',
      marketMakerFactory: '0x89023DEb1d9a9a62fF3A5ca8F23Be8d87A576220',
      conditionalTokens: '0xC59b0e4De5F1248C1140964E0fF287B192407E0C',
      oracle: '0x0e414d014a77971f4eaa22ab58e6d84d16ea838e',
      klerosBadge: '0xcb4aae35333193232421e86cd2e9b6c91f3b125f',
      klerosTokenView: '0xf9b9b5440340123b21bff1ddafe1ad6feb9d6e7f',
      klerosTCR: '0xebcf3bca271b26ae4b162ba560e243055af0e679',
      dxTCR: '0x93DB90445B76329e9ed96ECd74e76D8fbf2590d8',
      omenVerifiedMarkets: '0xb72103eE8819F2480c25d306eEAb7c3382fBA612',
      lpsd: DEFAULT_LIQUIDITY_PROTECTION_DEMANDFROM_ADDRESS_RINKEBY,
    },
    cpk: {
      masterCopyAddress: '0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F',
      proxyFactoryAddress: '0x0fB4340432e56c014fa96286de17222822a9281b',
      multiSendAddress: '0xc3BD4deCF75e9937aefb7a4CE6Ec8931dB4cfAF0',
      fallbackHandlerAddress: '0x40A930851BD2e590Bd5A5C981b436de25742E980',
    },
    wrapToken: 'weth',
    nativeAsset: {
      address: pseudoNativeAssetAddress,
      image: getImageUrl('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
      symbol: 'ETH',
      decimals: 18,
    },
    targetSafeImplementation: '0xCB2E9FA32603Cdc2740b82a9A67ED3e977C33416',
    defaultToken: 'dai',
    blockExplorer: 'etherscan',
    blockExplorerURL: 'https://etherscan.io',
  },
  [networkIds.RINKEBY]: {
    label: 'Rinkeby',
    url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
    alternativeUrls: [
      {
        rpcUrl: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
        name: 'Infura',
      },
    ],
    graphHttpUri: GRAPH_RINKEBY_HTTP,
    graphWsUri: GRAPH_RINKEBY_WS,
    klerosCurateGraphHttpUri: KLEROS_CURATE_GRAPH_RINKEBY_HTTP,
    klerosCurateGraphWsUri: KLEROS_CURATE_GRAPH_RINKEBY_WS,
    realitioTimeout: 180,
    earliestBlockToCheck: EARLIEST_RINKEBY_BLOCK_TO_CHECK,
    omenTCRListId: 1,
    contracts: {
      //DT:MISSING GELATOCORE
      //DT: realitio: '0xd884Be60433F6F0e2929Ca5EcEbEc5bEb8140461',
      realitio: '0x3D00D77ee771405628a4bA4913175EcC095538da',
      //DT: realitioScalarAdapter: '0xAc3CA3d915b351DFC9dd83BCdaAb3B315392F47d',
      realitioScalarAdapter: '0x0e8Db8caD541C0Bf5b611636e81fEc0828bc7902',
      //DT: marketMakerFactory: '0xB1b411da4d9861eBbb97266327337eE618d7c7f4',
      marketMakerFactory: '0x0fB4340432e56c014fa96286de17222822a9281b',
      //DT:  conditionalTokens: '0xEd83786DeE72d28A4790DE68d9D83Ec5440563FD',
      conditionalTokens: '0x36bede640D19981A82090519bC1626249984c908',
      //DT: oracle: '0x02CD9b60b5016F0e91E811316FCB5CcabB7A0197',
      oracle: '0x17174dC1b62add32a1DE477A357e75b0dcDEed6E',
      klerosBadge: '0x0000000000000000000000000000000000000000',
      klerosTokenView: '0x0000000000000000000000000000000000000000',
      klerosTCR: '0x0000000000000000000000000000000000000000',
      dxTCR: '0xf43F0C79d434637b26905A5c1A41bC02F1ab75ae',
      //OMEN: dxTCR: '0x03165DF66d9448E45c2f5137486af3E7e752a352',
      //Demiurge
      lpsd: DEFAULT_LIQUIDITY_PROTECTION_DEMANDFROM_ADDRESS_RINKEBY,
      omenVerifiedMarkets: '0x3b29096b7ab49428923d902cEC3dFEaa49993234',
    },
    cpk: {
      masterCopyAddress: '0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F',
      proxyFactoryAddress: '0x24276167aB604056c6131342ab807d7d4EA11366',
      //OMEN:  proxyFactoryAddress: '0x336c19296d3989e9e0c2561ef21c964068657c38',
      multiSendAddress: '0x82CFd05a033e202E980Bc99eA50A4C6BB91CE0d7',
      fallbackHandlerAddress: '0x40A930851BD2e590Bd5A5C981b436de25742E980',
    },
    wrapToken: 'weth',
    nativeAsset: {
      address: pseudoNativeAssetAddress,
      image: getImageUrl('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
      symbol: 'ETH',
      decimals: 18,
    },
    targetSafeImplementation: '0xcb05C7D28766e4fFB71ccbdAf6Ae1Cec555D61f8',
    defaultToken: 'dtg',
    blockExplorer: 'etherscan',
    blockExplorerURL: 'https://rinkeby.etherscan.io',
  },
  [networkIds.SOKOL]: {
    label: 'Sokol',
    url: 'https://sokol.poa.network',
    alternativeUrls: [
      {
        rpcUrl: 'https://sokol.poa.network',
        name: 'xDai',
      },
    ],
    graphHttpUri: GRAPH_SOKOL_HTTP,
    graphWsUri: GRAPH_SOKOL_WS,
    klerosCurateGraphHttpUri: KLEROS_CURATE_GRAPH_RINKEBY_HTTP,
    klerosCurateGraphWsUri: KLEROS_CURATE_GRAPH_RINKEBY_WS,
    realitioTimeout: 180,
    earliestBlockToCheck: EARLIEST_RINKEBY_BLOCK_TO_CHECK,
    omenTCRListId: 0,
    contracts: {
      realitio: '0x90a617ed516ab7fAaBA56CcEDA0C5D952f294d03',
      realitioScalarAdapter: '0x1D369EEC97cF2E62c8DBB804b3998Bf15bcb67dB',
      marketMakerFactory: '0x2fb8cc057946DCFA32D8eA8115A1Dd630f6efea5',
      conditionalTokens: '0x0Db8C35045a830DC7F2A4dd87ef90e7A9Cd0534f',
      oracle: '0x9E6bd63aEbFb2E858B6111cea9C389f7664F7108',
      klerosBadge: '0x0000000000000000000000000000000000000000',
      klerosTokenView: '0x0000000000000000000000000000000000000000',
      klerosTCR: '0x0000000000000000000000000000000000000000',
      dxTCR: '0x5486a9050f2aC6f535a72526e37738A060508361',
      omenVerifiedMarkets: '0x0000000000000000000000000000000000000000',
      lpsd: '0x0000000000000000000000000000000000000000',
    },
    cpk: {
      masterCopyAddress: '0x035000FC773f4a0e39FcdeD08A46aBBDBF196fd3',
      proxyFactoryAddress: '0xaaF0CCef0C0C355Ee764B3d36bcCF257C527269B',
      multiSendAddress: '0xBe95a1C930B7d4F816518Ad7742062537F928b99',
      fallbackHandlerAddress: '0x1e9C3EBAd833b26E522D2fDa180Af3D2A32459D2',
    },
    wrapToken: 'wspoa',
    nativeAsset: {
      address: pseudoNativeAssetAddress,
      image: getImageUrl('0x6b175474e89094c44da98b954eedeac495271d0f'),
      symbol: 'SPOA',
      decimals: 18,
    },
    targetSafeImplementation: '0x035000FC773f4a0e39FcdeD08A46aBBDBF196fd3',
    blockExplorer: 'blockscout',
    blockExplorerURL: 'https://blockscout.com/poa/sokol',
  },
  [networkIds.XDAI]: {
    label: 'xDai',
    url: 'https://rpc.xdaichain.com/',
    alternativeUrls: [
      {
        rpcUrl: 'https://rpc.xdaichain.com/',
        name: 'xDai',
      },
      {
        rpcUrl: 'https://dai.poa.network/',
        name: 'Blockscout',
      },
    ],
    graphHttpUri: GRAPH_XDAI_HTTP,
    graphWsUri: GRAPH_XDAI_WS,
    klerosCurateGraphHttpUri: KLEROS_CURATE_GRAPH_RINKEBY_HTTP,
    klerosCurateGraphWsUri: KLEROS_CURATE_GRAPH_RINKEBY_WS,
    realitioTimeout: 86400,
    earliestBlockToCheck: EARLIEST_RINKEBY_BLOCK_TO_CHECK,
    omenTCRListId: 2,
    contracts: {
      realitio: '0x79e32aE03fb27B07C89c0c568F80287C01ca2E57',
      realitioScalarAdapter: '0xcA75aaC320089c9fb077E86857fF6e954Df06a6B',
      marketMakerFactory: '0x9083A2B699c0a4AD06F63580BDE2635d26a3eeF0',
      conditionalTokens: '0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce',
      oracle: '0xAB16D643bA051C11962DA645f74632d3130c81E2',
      klerosBadge: '0x0000000000000000000000000000000000000000',
      klerosTokenView: '0x0000000000000000000000000000000000000000',
      klerosTCR: '0x0000000000000000000000000000000000000000',
      dxTCR: '0x85E001DfFF16F388Bc32Cd18009ceDF8F9b62C9E',
      omenVerifiedMarkets: '0x0000000000000000000000000000000000000000',
      lpsd: '0x0000000000000000000000000000000000000000',
    },
    cpk: {
      masterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
      proxyFactoryAddress: '0x3049b84bbC3EB2C375547CAc0D77da032d3d1981',
      multiSendAddress: '0x035000FC773f4a0e39FcdeD08A46aBBDBF196fd3',
      fallbackHandlerAddress: '0x602DF5F404f86469459D5e604CDa43A2cdFb7580',
    },
    relayProxyFactoryAddress: '0x7b9756f8A7f4208fE42FE8DE8a8CC5aA9A03f356',
    wrapToken: 'wxdai',
    nativeAsset: {
      address: pseudoNativeAssetAddress,
      image: getImageUrl('0x6b175474e89094c44da98b954eedeac495271d0f'),
      symbol: 'xDAI',
      decimals: 18,
    },
    targetSafeImplementation: '0x9C75A217AEA76663a9A37687606f099945eb0742',
    blockExplorer: 'blockscout',
    blockExplorerURL: 'https://blockscout.com/poa/xdai',
  },
}

export const getChainSpecificAlternativeUrls = (networkId: any) => {
  if (!validNetworkId(networkId)) {
    return false
  }

  return networks[networkId].alternativeUrls
}
if (localStorage.getItem('rpcAddress')) {
  const data = JSON.parse(<string>localStorage.getItem('rpcAddress'))
  const network: NetworkId = data.network
  networks[network].url = data.url
}

export const supportedNetworkIds = Object.keys(networks).map(Number) as NetworkId[]

export const supportedNetworkURLs = entries(networks).reduce<{
  [networkId: number]: string
}>(
  (acc, [networkId, network]) => ({
    ...acc,
    [networkId]: network.url,
  }),
  {},
)

export const getInfuraUrl = (networkId: number): string => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  return networks[networkId].url
}

export const knownTokens: { [name in KnownToken]: KnownTokenData } = {
  dtg: {
    symbol: 'USD',
    decimals: 8,
    addresses: {
      [networkIds.RINKEBY]: '0x1df2d7f7ddf26702b97869c5e39fce880660b5bf',
    },
    order: 11,
  },
  wxdai: {
    symbol: 'wxDAI',
    decimals: 18,
    addresses: {
      [networkIds.XDAI]: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
    },
    order: 1,
  },
  wbtc: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    addresses: {
      [networkIds.MAINNET]: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      [networkIds.RINKEBY]: '0x577d296678535e4903d59a4c929b718e1d575e0a',
      [networkIds.XDAI]: '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252',
    },
    order: 14,
  },
  dai: {
    symbol: 'DAI',
    name: 'Dai',
    decimals: 18,
    addresses: {
      [networkIds.MAINNET]: '0x6b175474e89094c44da98b954eedeac495271d0f',
      [networkIds.RINKEBY]: '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
    },
    order: 1,
  },
  weth: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    addresses: {
      [networkIds.MAINNET]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      [networkIds.RINKEBY]: '0x49f158BD0348AC089A0F08128e54c2759649885A',
      //OMEN:  [networkIds.RINKEBY]: '0xc778417e063141139fce010982780140aa0cd5ab',
      [networkIds.XDAI]: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
    },
    order: 3,
  },
  usdc: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      [networkIds.MAINNET]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      [networkIds.RINKEBY]: '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b',
      // [networkIds.XDAI]: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
    },
    order: 4,
  },
}
//when adding new bridge currency ensure that it's present in known tokens and that it has both mainnet and xDai address added
export const bridgeTokensList: KnownToken[] = ['dai', 'weth', 'wbtc']

const validNetworkId = (networkId: number): networkId is NetworkId => {
  return networks[networkId as NetworkId] !== undefined
}

export const getContractAddress = (networkId: number, contract: KnownContracts) => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  return networks[networkId].contracts[contract]
}

export const getToken = (networkId: number, tokenId: KnownToken): Token => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const token = knownTokens[tokenId]
  if (!token) {
    throw new Error(`Unsupported token id: '${tokenId}'`)
  }

  const address = token.addresses[networkId]

  if (!address) {
    throw new Error(`Unsupported address in network: '${networkId}'`)
  }

  return {
    address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name ? token.name : '',
    image: getImageUrl(address),
  }
}

export const getTokenFromAddress = (networkId: number, address: string): Token => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  for (const token of Object.values(knownTokens)) {
    const tokenAddress = token.addresses[networkId]

    // token might not be supported in the current network
    if (!tokenAddress) {
      continue
    }

    if (tokenAddress.toLowerCase() === address.toLowerCase()) {
      return {
        address: tokenAddress,
        decimals: token.decimals,
        symbol: token.symbol,
      }
    }
  }

  throw new Error(`Couldn't find token with address '${address}' in network '${networkId}'`)
}

export const getContractAddressName = (networkId: number) => {
  const networkName = Object.keys(networkIds).find(key => (networkIds as any)[key] === networkId)
  const networkNameCase = networkName && networkName.substr(0, 1).toUpperCase() + networkName.substr(1).toLowerCase()
  return networkNameCase
}

export const getDefaultToken = (networkId: number, relay = false) => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const defaultToken = networks[networkId].defaultToken as KnownToken
  if (defaultToken) {
    return getToken(networkId, defaultToken)
  }

  return getNativeAsset(networkId, relay)
}

export const getTokensByNetwork = (networkId: number): Token[] => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const wrapTokenAddress = getWrapToken(networkId).address
  const nativeAsset = getNativeAsset(networkId)

  return Object.values(knownTokens)
    .sort((a, b) => (a.order > b.order ? 1 : -1))
    .map(token => {
      const address = token.addresses[networkId]
      if (address) {
        return {
          symbol: token.symbol,
          decimals: token.decimals,
          image: address === wrapTokenAddress ? nativeAsset.image : getImageUrl(address),
          address,
        }
      }
      return null
    })
    .filter(isNotNull)
}

interface KnownArbitratorData {
  name: string
  url: string
  addresses: {
    [networkId: number]: string
  }
  isSelectionEnabled: boolean
}

export const knownArbitrators: { [name in KnownArbitrator]: KnownArbitratorData } = {
  kleros: {
    name: 'Kleros',
    url: 'https://kleros.io/',
    addresses: {
      [networkIds.MAINNET]: '0xd47f72a2d1d0E91b0Ec5e5f5d02B2dc26d00A14D',
      [networkIds.RINKEBY]: '0xcafa054b1b054581faf65adce667bf1c684b6ef0',
      [networkIds.SOKOL]: '0x37Fcdb26F12f3FC76F2424EC6B94D434a959A0f7',
      [networkIds.XDAI]: '0xe40DD83a262da3f56976038F1554Fe541Fa75ecd',
    },
    isSelectionEnabled: true,
  },
  dxdao: {
    name: 'DXdao',
    url: 'https://dxdao.eth.link/',
    addresses: {
      [networkIds.XDAI]: '0xFe14059344b74043Af518d12931600C0f52dF7c5',
    },
    isSelectionEnabled: true,
  },
  dt: {
    name: 'DT',
    url: 'https://dt.eth.link/',
    addresses: {
      [networkIds.RINKEBY]: DEFAULT_AUTHORIZED_MARKET_HOST_RINKEBY,
    },
    isSelectionEnabled: true,
  },
  unknown: {
    name: 'Unknown',
    url: '',
    addresses: {},
    isSelectionEnabled: true,
  },
}

export const getArbitrator = (networkId: number, arbitratorId: KnownArbitrator): Arbitrator => {
  const arbitrator = knownArbitrators[arbitratorId]
  const address = arbitrator.addresses[networkId]

  if (!address) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  return {
    id: arbitratorId,
    address,
    name: arbitrator.name,
    url: arbitrator.url,
    isSelectionEnabled: arbitrator.isSelectionEnabled,
  }
}

export const getDefaultArbitrator = (networkId: number): Arbitrator => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  return getArbitrator(networkId, DEFAULT_ARBITRATOR)
}

export const getArbitratorFromAddress = (networkId: number, address: string): Arbitrator => {
  for (const key in knownArbitrators) {
    const arbitrator = knownArbitrators[key as KnownArbitrator]
    const arbitratorAddress = arbitrator.addresses[networkId]

    // arbitratorId might not be supported in the current network
    if (!arbitratorAddress) {
      continue
    }

    if (arbitratorAddress.toLowerCase() === address.toLowerCase()) {
      return {
        id: key as KnownArbitrator,
        address: arbitratorAddress,
        name: arbitrator.name,
        url: arbitrator.url,
        isSelectionEnabled: arbitrator.isSelectionEnabled,
      }
    }
  }

  return {
    id: 'unknown' as KnownArbitrator,
    address: address,
    name: 'Unknown',
    url: '',
    isSelectionEnabled: false,
  }
}

export const getKnowArbitratorFromAddress = (networkId: number, address: string): KnownArbitrator => {
  for (const key in knownArbitrators) {
    const arbitratorAddress = knownArbitrators[key as KnownArbitrator].addresses[networkId]

    if (!arbitratorAddress) {
      continue
    }

    if (arbitratorAddress.toLowerCase() === address.toLowerCase()) {
      return key as KnownArbitrator
    }
  }

  return 'unknown' as KnownArbitrator
}

export const getRealitioTimeout = (networkId: number): number => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  return networks[networkId].realitioTimeout
}

export const getEarliestBlockToCheck = (networkId: number): number => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  return networks[networkId].earliestBlockToCheck
}

export const getArbitratorsByNetwork = (networkId: number): Arbitrator[] => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  return Object.values(knownArbitrators)
    .map(arbitrator => {
      const address = arbitrator.addresses[networkId]
      if (address) {
        const { isSelectionEnabled, name, url } = arbitrator
        const id = getKnowArbitratorFromAddress(networkId, address)

        return {
          id,
          name,
          url,
          address,
          isSelectionEnabled,
        }
      }
      return null
    })
    .filter(isNotNull)
}

export const getCPKAddresses = (networkId: number): Maybe<CPKAddresses> => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const cpkAddresses = networks[networkId].cpk
  return cpkAddresses || null
}

export const getRelayProxyFactory = (networkId: number): Maybe<string> => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const proxyFactoryAddress = networks[networkId].relayProxyFactoryAddress
  return proxyFactoryAddress || null
}

export const getGraphUris = (networkId: number): { httpUri: string; wsUri: string } => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const httpUri = networks[networkId].graphHttpUri
  const wsUri = networks[networkId].graphWsUri
  return { httpUri, wsUri }
}

export const getKlerosCurateGraphUris = (networkId: number): { httpUri: string; wsUri: string } => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  const httpUri = networks[networkId].klerosCurateGraphHttpUri
  const wsUri = networks[networkId].klerosCurateGraphWsUri
  return { httpUri, wsUri }
}

export const getOutcomes = (networkId: number, templateId: number) => {
  const isBinary = templateId === 0
  const isNuancedBinary = (networkId === 1 && templateId === 6) || (networkId === 4 && templateId === 5)
  const isScalar = templateId === 1
  if (isBinary || isNuancedBinary) {
    return ['No', 'Yes']
  } else if (isScalar) {
    return []
  } else {
    throw new Error(`Cannot get outcomes for network '${networkId}' and template id '${templateId}'`)
  }
}

export const getOmenTCRListId = (networkId: number): number => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }

  return networks[networkId].omenTCRListId
}

export const getWrapToken = (networkId: number): Token => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  const tokenId = networks[networkId].wrapToken as KnownToken
  return getToken(networkId, tokenId)
}

export const getNativeAsset = (networkId: number, relay = false): Token => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  const asset = networks[networkId].nativeAsset as Token
  if (relay) {
    const symbol = asset.symbol.replace('x', '')
    return { ...asset, symbol }
  }
  return asset
}

export const getTargetSafeImplementation = (networkId: number): string => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  return networks[networkId].targetSafeImplementation.toLowerCase()
}

export const getBlockExplorer = (networkId: number): string => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  return networks[networkId].blockExplorer
}

export const getTxHashBlockExplorerURL = (networkId: number, txHash: string): string => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  return `${networks[networkId].blockExplorerURL}/tx/${txHash}`
}

export const getAddressBlockExplorerURL = (networkId: number, contractAddress: string): string => {
  if (!validNetworkId(networkId)) {
    throw new Error(`Unsupported network id: '${networkId}'`)
  }
  return `${networks[networkId].blockExplorerURL}/address/${contractAddress}`
}
