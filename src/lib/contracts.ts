export const ECOLEDGER_ADDRESS = import.meta.env.VITE_ECOLEDGER_ADDRESS ?? ''
export const ECOTOKEN_ADDRESS  = import.meta.env.VITE_ECOTOKEN_ADDRESS  ?? ''
export const CHAIN_ID          = Number(import.meta.env.VITE_CHAIN_ID ?? 11155111)
export const EXPLORER          = 'https://sepolia.etherscan.io'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface RelayResult {
  txHash: string
  blockNumber: number
}

/**
 * Call the backend relay-tx edge function.
 * The relay uses the deployer wallet to call EcoLedger on-chain — users need no gas.
 * Non-throwing: returns null on failure so callers can treat it as non-fatal.
 */
export async function relayTx(params: {
  action: 'register' | 'transfer' | 'dispose'
  deviceId: string
  userWallet: string
  toWallet?: string
  creditsAmount?: number
}): Promise<RelayResult | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/relay-tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(params),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      console.error('[relayTx] error:', data.error)
      return null
    }
    return { txHash: data.txHash, blockNumber: data.blockNumber }
  } catch (err) {
    console.error('[relayTx] network error:', err)
    return null
  }
}
