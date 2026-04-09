export type OwnerStatus = 'new' | 'cold' | 'warm' | 'hot' | 'contacted' | 'not_interested' | 'closed'
export type NoteType = 'general' | 'call' | 'whatsapp' | 'meeting' | 'follow_up'
export type InteractionType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'sms'
export type InteractionOutcome = 'answered' | 'no_answer' | 'callback' | 'not_interested' | 'interested' | 'voicemail' | 'wrong_number'

export interface Community { id: string; name: string; created_at: string }
export interface SubCommunity { id: string; community_id: string; name: string; created_at: string }
export interface Owner { id: string; name: string | null; phone: string | null; whatsapp: string | null; email: string | null; status: OwnerStatus; confidence_score: number | null; is_deleted: boolean; created_at: string; updated_at: string }
export interface Property { id: string; sub_community_id: string | null; unit_number: string; property_type: string | null; beds: number | null; built_up_area: number | null; is_deleted: boolean; created_at: string }
export interface Ownership { id: string; owner_id: string; property_id: string; ownership_percentage: number; purchase_price: number | null; purchase_date: string | null }
export interface Note { id: string; owner_id: string; note: string; note_type: NoteType; created_at: string }
export interface Interaction { id: string; owner_id: string; interaction_type: InteractionType; outcome: InteractionOutcome | null; created_at: string }
export interface OwnerSummary { id: string; name: string | null; phone: string | null; whatsapp: string | null; email: string | null; status: OwnerStatus; confidence_score: number | null; created_at: string; updated_at: string; unit_count: number; sub_communities: string[] | null; unit_numbers: string[] | null }
export interface PropertyDetail { id: string; unit_number: string; property_type: string | null; beds: number | null; built_up_area: number | null; sub_community: string | null; community: string | null; owner_names: string[] | null; owner_phones: string[] | null; owner_ids: string[] | null }
export interface DashboardStats { total_owners: number; owners_with_phone: number; total_investors: number; total_properties: number }
