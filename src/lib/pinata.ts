import { supabase } from '@/lib/supabase'

const JWT = (import.meta.env.VITE_PINATA_JWT as string | undefined)?.trim()
const GATEWAY = 'https://gateway.pinata.cloud/ipfs'
/** A Pinata JWT has three dot-separated parts; anything else is a missing/placeholder key. */
const PINATA_CONFIGURED = !!JWT && JWT.split('.').length === 3

export interface PinataUploadResult {
  /** IPFS content hash, or null when the file was stored in Supabase Storage instead. */
  ipfsHash: string | null
  url: string
}

type Bucket = 'receipts' | 'evidence'

/**
 * Uploads a file (device receipt, disposal evidence) and returns its URL.
 * Goes to IPFS via Pinata when configured; otherwise — or if Pinata fails —
 * stores it in Supabase Storage so the user's action never fails on the upload.
 */
export async function uploadToIPFS(
  file: File,
  metadata: { name: string; keyvalues?: Record<string, string> },
  bucket: Bucket = 'receipts',
): Promise<PinataUploadResult> {
  if (PINATA_CONFIGURED) {
    try {
      return await uploadToPinata(file, metadata)
    } catch (err) {
      console.warn('[upload] Pinata failed, using Supabase Storage:', err)
    }
  }
  return uploadToStorage(file, metadata.name, bucket)
}

async function uploadToPinata(
  file: File,
  metadata: { name: string; keyvalues?: Record<string, string> },
): Promise<PinataUploadResult> {
  const body = new FormData()
  body.append('file', file)
  body.append('pinataMetadata', JSON.stringify({ name: metadata.name, keyvalues: metadata.keyvalues ?? {} }))
  body.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

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
  return { ipfsHash: IpfsHash, url: `${GATEWAY}/${IpfsHash}` }
}

async function uploadToStorage(file: File, name: string, bucket: Bucket): Promise<PinataUploadResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in again to upload files.')

  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
  const safe = name.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 80)
  const path = `${user.id}/${safe}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: true,
  })
  if (error) throw new Error(`Could not upload the file: ${error.message}`)

  // Private bucket: share via a long-lived signed link saved on the record
  const { data, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
  if (signErr || !data) throw new Error(`Could not create a link for the file: ${signErr?.message ?? 'unknown error'}`)
  return { ipfsHash: null, url: data.signedUrl }
}
