// relay-tx: Backend relay that calls EcoLedger on behalf of users.
// Users need zero gas — the deployer wallet pays and signs every tx.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { ethers } from 'npm:ethers@6.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRIVATE_KEY      = Deno.env.get('DEPLOYER_PRIVATE_KEY')!
const RPC_URL          = Deno.env.get('RPC_URL') ?? 'https://ethereum-sepolia-rpc.publicnode.com'
const ECOLEDGER_ADDR   = Deno.env.get('ECOLEDGER_ADDRESS')!
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ABI = [
  'function registerDevice(bytes32 deviceId, address user) external',
  'function transferDevice(bytes32 deviceId, address from, address to) external',
  'function disposeDevice(bytes32 deviceId, address user, uint256 creditsAmount) external',
  'function getDevice(bytes32 deviceId) external view returns (tuple(bytes32 deviceId, address currentOwner, uint8 status, uint256 registeredAt))',
]

// Convert Supabase UUID → bytes32 (pad UUID hex to 32 bytes)
function uuidToBytes32(uuid: string): string {
  return '0x' + uuid.replace(/-/g, '').padEnd(64, '0')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { action, deviceId, userWallet, toWallet, creditsAmount } = await req.json()

    if (!action || !deviceId) throw new Error('Missing action or deviceId')
    if (!PRIVATE_KEY)         throw new Error('DEPLOYER_PRIVATE_KEY not configured')
    if (!ECOLEDGER_ADDR)      throw new Error('ECOLEDGER_ADDRESS not configured')

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider)
    const contract = new ethers.Contract(ECOLEDGER_ADDR, ABI, signer)
    const bytes32  = uuidToBytes32(deviceId)

    let tx: ethers.TransactionResponse

    if (action === 'register') {
      if (!userWallet) throw new Error('Missing userWallet for register')
      tx = await contract.registerDevice(bytes32, userWallet)

    } else if (action === 'transfer') {
      if (!userWallet || !toWallet) throw new Error('Missing userWallet or toWallet for transfer')
      tx = await contract.transferDevice(bytes32, userWallet, toWallet)

    } else if (action === 'dispose') {
      if (!userWallet) throw new Error('Missing userWallet for dispose')
      const credits = BigInt(Math.round(creditsAmount ?? 0))
      tx = await contract.disposeDevice(bytes32, userWallet, credits)

    } else {
      throw new Error(`Unknown action: ${action}`)
    }

    const receipt = await tx.wait()
    if (!receipt) throw new Error('Transaction receipt not received')

    const txHash     = receipt.hash
    const blockNum   = receipt.blockNumber

    // Write tx_hash back to the most recent matching device_lifecycle row
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const eventType = action === 'register' ? 'registered' : action === 'transfer' ? 'transferred' : 'disposed'

    const { data: rows } = await supabase
      .from('device_lifecycle')
      .select('id')
      .eq('device_id', deviceId)
      .eq('event_type', eventType)
      .is('tx_hash', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (rows && rows.length > 0) {
      await supabase
        .from('device_lifecycle')
        .update({ tx_hash: txHash, block_number: blockNum })
        .eq('id', rows[0].id)
    }

    // Also stamp the device record itself
    await supabase
      .from('devices')
      .update({ chain_tx_hash: txHash, block_number: blockNum })
      .eq('id', deviceId)

    return new Response(
      JSON.stringify({ success: true, txHash, blockNumber: blockNum }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[relay-tx]', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
