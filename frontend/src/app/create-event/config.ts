import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo, baseSepolia, rootstockTestnet } from 'viem/chains'

// Network configurations
export const networks = {
    celo: {
        id: 42220,
        name: 'Celo Mainnet',
        network: 'celo',
        nativeCurrency: {
            decimals: 18,
            name: 'Celo',
            symbol: 'CELO',
        },
        rpcUrls: {
            default: {
                http: ['https://forno.celo.org'],
            },
            public: {
                http: ['https://forno.celo.org'],
            },
        },
        blockExplorers: {
            default: { name: 'Celo Explorer', url: 'https://explorer.celo.org' },
        },
        contractAddress: '0x723733980ce3881d2c9421E3A76bB61636E47c1e',
        testnet: false,
    },
    baseSepolia: {
        id: 84531,
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: {
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH',
        },
        rpcUrls: {
            default: {
                http: ['https://sepolia.base.org'],
            },
            public: {
                http: ['https://sepolia.base.org'],
            },
        },
        blockExplorers: {
            default: { name: 'Base Sepolia Explorer', url: 'https://sepolia.basescan.org' },
        },
        contractAddress: '0x2D5b75e537b6424A42B7D065AFa511D5aa484B01',
        testnet: true,
    },
    rootstockTestnet: {
        id: 31,
        name: 'Rootstock Testnet',
        network: 'rootstock-testnet',
        nativeCurrency: {
            decimals: 18,
            name: 'Test Bitcoin',
            symbol: 'tRBTC',
        },
        rpcUrls: {
            default: {
                http: ['https://public-node.testnet.rsk.co'],
            },
            public: {
                http: ['https://public-node.testnet.rsk.co'],
            },
        },
        blockExplorers: {
            default: { name: 'RSK Explorer', url: 'https://explorer.testnet.rsk.co' },
        },
        contractAddress: '0xbF452C9d17763bEc4692BBc54F29A5bC03aF6c3A',
        testnet: true,
    }
};

// Dynamic client creation based on network
export const createClients = (networkKey: keyof typeof networks) => {
    const network = networks[networkKey];

    const publicClient = createPublicClient({
        chain: network,
        transport: http(network.rpcUrls.default.http[0])
    });

    const getWalletClient = () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            return createWalletClient({
                chain: network,
                transport: custom(window.ethereum)
            });
        }
        return null;
    };

    const walletClient = createWalletClient({
        chain: network,
        transport: custom(window.ethereum)
    });

    const chainConfig = {
        chainId: `0x${network.id.toString(16)}`,
        chainName: network.name,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: network.rpcUrls.default.http,
        blockExplorerUrls: [network.blockExplorers?.default?.url],
    };

    return {
        publicClient,
        walletClient,
        getWalletClient,
        chainConfig,
        contractAddress: network.contractAddress
    };
};

// Default exports using Celo
const defaultNetwork = 'celo';
const {
    publicClient,
    walletClient,
    getWalletClient,
    chainConfig,
    contractAddress
} = createClients(defaultNetwork);

export {
    publicClient,
    walletClient,
    getWalletClient,
    chainConfig,
    contractAddress
};

// Local Account (for testing)
export const account = privateKeyToAccount('0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e');

// Network IDs reference
// baseSepolia 845384532 (0x14a34)	ETH  https://sepolia.base.org
// celo 42220 (0xa4ec)	CELO  https://forno.celo.org
// rootstockTestnet 31(0x1f)	tRBTC https://public-node.testnet.rsk.co