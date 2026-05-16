export type UserRole = 'consumer' | 'manufacturer' | 'recycler' | 'regulator' | 'auditor' | 'admin'

export type DeviceStatus = 'in_use' | 'awaiting_transfer' | 'ready_for_disposal' | 'disposed' | 'flagged'

export type DisposalType = 'recycle' | 'refurbish' | 'salvage_parts' | 'hazardous'

export type HazardClass = 'li_ion_battery' | 'toner' | 'mercury_ccfl' | 'mixed' | 'none'

export type TransactionType = 'registration' | 'transfer' | 'disposal' | 'reward'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      user_roles: {
        Row: UserRoleRecord
        Insert: Omit<UserRoleRecord, 'created_at'>
        Update: Partial<UserRoleRecord>
      }
      devices: {
        Row: Device
        Insert: Omit<Device, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Device, 'id'>>
      }
      device_lifecycle: {
        Row: DeviceLifecycleEvent
        Insert: Omit<DeviceLifecycleEvent, 'id' | 'created_at'>
        Update: never
      }
      transfers: {
        Row: Transfer
        Insert: Omit<Transfer, 'id' | 'created_at'>
        Update: Partial<Omit<Transfer, 'id'>>
      }
      disposals: {
        Row: Disposal
        Insert: Omit<Disposal, 'id' | 'created_at'>
        Update: Partial<Omit<Disposal, 'id'>>
      }
      eco_credits: {
        Row: EcoCredit
        Insert: Omit<EcoCredit, 'id' | 'created_at'>
        Update: Partial<Omit<EcoCredit, 'id'>>
      }
      recycler_facilities: {
        Row: RecyclerFacility
        Insert: Omit<RecyclerFacility, 'id' | 'created_at'>
        Update: Partial<Omit<RecyclerFacility, 'id'>>
      }
      compliance_flags: {
        Row: ComplianceFlag
        Insert: Omit<ComplianceFlag, 'id' | 'created_at'>
        Update: Partial<Omit<ComplianceFlag, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id'>>
      }
      invitations: {
        Row: Invitation
        Insert: Omit<Invitation, 'id' | 'created_at' | 'accepted_at'> & { accepted_at?: string | null }
        Update: Partial<Omit<Invitation, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      device_status: DeviceStatus
      disposal_type: DisposalType
      hazard_class: HazardClass
    }
  }
}

export interface Profile {
  id: string
  supabase_uid: string
  privy_id: string | null
  wallet_address: string | null
  email: string | null
  full_name: string | null
  organization: string | null
  phone: string | null
  country: string
  city: string | null
  avatar_url: string | null
  active_role: UserRole
  created_at: string
  updated_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  organization: string | null
  is_verified: boolean
  verified_by: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Device {
  id: string
  token_id: string | null
  imei: string | null
  serial_number: string | null
  brand: string
  model: string
  category: string
  manufacture_year: number | null
  current_owner_id: string
  original_owner_id: string
  retailer_name: string | null
  retailer_wallet: string | null
  purchase_date: string | null
  purchase_price_lrd: number | null
  status: DeviceStatus
  hazard_class: HazardClass
  receipt_url: string | null
  receipt_ipfs_hash: string | null
  chain_tx_hash: string | null
  block_number: number | null
  co2_kg_avoided: number
  material_gold_g: number
  material_copper_g: number
  material_aluminum_g: number
  material_lithium_g: number
  material_cobalt_g: number
  material_lead_g: number
  created_at: string
  updated_at: string
}

export interface DeviceLifecycleEvent {
  id: string
  device_id: string
  event_type: 'manufactured' | 'registered' | 'transferred' | 'disposed' | 'flagged'
  actor_id: string
  actor_name: string | null
  location: string | null
  tx_hash: string | null
  block_number: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Transfer {
  id: string
  device_id: string
  from_user_id: string
  to_user_id: string
  reason: 'resale' | 'donation' | 'gift' | 'warranty_return'
  sale_price_lrd: number | null
  condition_notes: string | null
  evidence_urls: string[]
  tx_hash: string | null
  status: 'pending' | 'signed' | 'confirmed' | 'rejected'
  created_at: string
}

export interface Disposal {
  id: string
  device_id: string
  recycler_id: string
  facility_id: string
  disposal_type: DisposalType
  final_mass_kg: number
  hazard_class: HazardClass
  downstream_destination: string | null
  evidence_urls: string[]
  component_breakdown: Record<string, number>
  eco_credits_awarded: number
  tx_hash: string | null
  ipfs_hash: string | null
  status: 'pending' | 'signed' | 'confirmed'
  created_at: string
}

export interface EcoCredit {
  id: string
  user_id: string
  amount: number
  type: 'earned' | 'redeemed' | 'bonus'
  source: string
  device_id: string | null
  disposal_id: string | null
  description: string | null
  created_at: string
}

export interface RewardCatalogueItem {
  id: string
  title: string
  partner: string
  category: string
  cost_ec: number
  image_url: string | null
  description: string | null
  stock: number | null
  is_active: boolean
  created_at: string
}

export interface Redemption {
  id: string
  user_id: string
  catalogue_item_id: string
  item_title: string
  item_partner: string
  ec_cost: number
  status: 'pending' | 'fulfilled' | 'failed'
  notes: string | null
  fulfilled_by: string | null
  fulfilled_at: string | null
  created_at: string
}

export interface RecyclerFacility {
  id: string
  owner_id: string
  name: string
  license_number: string
  location_city: string
  location_county: string
  latitude: number | null
  longitude: number | null
  operating_hours: string | null
  accepts_free_pickup: boolean
  is_basel_certified: boolean
  is_active: boolean
  total_devices_processed: number
  created_at: string
}

export interface ComplianceFlag {
  id: string
  flag_type: 'unauthorized_export' | 'informal_collector' | 'unverified_disposal' | 'missing_owner'
  device_id: string | null
  reporter_id: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  description: string
  evidence_urls: string[]
  stakeholders_looped: string[]
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'action_required' | 'success'
  is_read: boolean
  link: string | null
  created_at: string
}

export interface Invitation {
  id: string
  email: string
  role: UserRole
  organization: string
  invited_by: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}
