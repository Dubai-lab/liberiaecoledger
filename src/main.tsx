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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#15803d',
          logo: '/favicon.svg',
        },
        loginMethods: ['email', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          id: 80002,
          name: 'Polygon Amoy',
          network: 'maticamoy',
          nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://rpc-amoy.polygon.technology'] },
          },
          blockExplorers: {
            default: { name: 'Amoy Polygonscan', url: 'https://amoy.polygonscan.com' },
          },
          testnet: true,
        },
        supportedChains: [
          {
            id: 80002,
            name: 'Polygon Amoy',
            network: 'maticamoy',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://rpc-amoy.polygon.technology'] },
            },
            blockExplorers: {
              default: { name: 'Amoy Polygonscan', url: 'https://amoy.polygonscan.com' },
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
