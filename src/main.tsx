import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID as string
const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#15803d',
          logo: 'https://liberiaecoledger.com/app-icon-192.png',
        },
        loginMethods: ['email', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        ...(wcProjectId ? { walletConnectCloudProjectId: wcProjectId } : {}),
        defaultChain: {
          id: 11155111,
          name: 'Sepolia',
          network: 'sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
          },
          blockExplorers: {
            default: { name: 'Sepolia Etherscan', url: 'https://sepolia.etherscan.io' },
          },
          testnet: true,
        },
        supportedChains: [
          {
            id: 11155111,
            name: 'Sepolia',
            network: 'sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
            },
            blockExplorers: {
              default: { name: 'Sepolia Etherscan', url: 'https://sepolia.etherscan.io' },
            },
            testnet: true,
          },
        ],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </QueryClientProvider>
    </PrivyProvider>
  </StrictMode>,
)
