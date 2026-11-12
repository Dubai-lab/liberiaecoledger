import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlatformRate } from '@/types/database'

/** Fallbacks mirror the seed values in 20261113_manufacturer_imei_registry_and_rates.sql */
export const DEFAULT_RATES: Record<string, number> = {
  credits_registration: 10,
  credits_registration_other: 10,
  credits_transfer:     5,
  lrd_per_credit:       150,
  price_gold:           7500,
  price_copper:         750,
  price_aluminum:       300,
  price_lithium:        4500,
  price_cobalt:         3000,
  price_lead:           450,
}

export const MATERIAL_KEYS = ['gold', 'copper', 'aluminum', 'lithium', 'cobalt', 'lead'] as const
export type Material = typeof MATERIAL_KEYS[number]
export type MaterialGrams = Record<Material, number>

export function usePlatformRates() {
  const [rows, setRows] = useState<PlatformRate[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data } = await supabase.from('platform_rates').select('*').order('sort_order')
    setRows((data ?? []) as PlatformRate[])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const values: Record<string, number> = { ...DEFAULT_RATES }
  for (const r of rows) values[r.key] = Number(r.value)

  return { rows, values, loading, reload }
}

/** EcoCredits a material contributes per gram = market price ÷ LRD value of one credit. */
export function creditsPerGram(values: Record<string, number>, m: Material) {
  const lrdPerCredit = values.lrd_per_credit || DEFAULT_RATES.lrd_per_credit
  return (values[`price_${m}`] ?? 0) / lrdPerCredit
}

export function calcDisposalCredits(values: Record<string, number>, grams: MaterialGrams) {
  return Math.round(MATERIAL_KEYS.reduce((sum, m) => sum + (grams[m] || 0) * creditsPerGram(values, m), 0))
}

/** 15 digits with a valid Luhn check digit (same rule as is_valid_imei() in the database). */
export function isValidImei(raw: string) {
  const imei = raw.replace(/\D/g, '')
  if (!/^\d{15}$/.test(imei)) return false
  let total = 0
  for (let i = 0; i < 15; i++) {
    let d = Number(imei[i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    total += d
  }
  return total % 10 === 0
}

export const normaliseImei = (raw: string) => raw.replace(/\D/g, '').slice(0, 15)
