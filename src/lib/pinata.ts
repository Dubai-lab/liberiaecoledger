const JWT = import.meta.env.VITE_PINATA_JWT as string
const GATEWAY = 'https://gateway.pinata.cloud/ipfs'

export interface PinataUploadResult {
  ipfsHash: string
  url: string
}

/**
 * Uploads a file to IPFS via Pinata and returns the hash + gateway URL.
 * Used for device receipts and disposal evidence.
 */
export async function uploadToIPFS(
  file: File,
  metadata: { name: string; keyvalues?: Record<string, string> },
): Promise<PinataUploadResult> {
  const body = new FormData()
  body.append('file', file)
  body.append(
    'pinataMetadata',
    JSON.stringify({ name: metadata.name, keyvalues: metadata.keyvalues ?? {} }),
  )
  body.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 }),
  )

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${JWT}` },
    body,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.details ?? `Pinata upload failed (${res.status})`)
  }

  const { IpfsHash } = await res.json()
  return {
    ipfsHash: IpfsHash,
    url: `${GATEWAY}/${IpfsHash}`,
  }
}
