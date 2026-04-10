import { OwnerStatus } from '@/types'

/**
 * Normalizes a phone number to E.164 format (+XXXXXXXXXXX).
 * Assumes UAE (+971) as the default country for unqualified numbers.
 */
export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  const stripped = phone.trim().replace(/[^\d+]/g, '')
  if (!stripped) return null

  // Already E.164
  if (stripped.startsWith('+')) return stripped

  // Country code present without plus: 971XXXXXXXXX
  if (stripped.startsWith('971') && stripped.length >= 11) return `+${stripped}`

  // UAE local format: 0XXXXXXXXX (10 digits, leading 0)
  if (stripped.startsWith('0') && stripped.length === 10) return `+971${stripped.slice(1)}`

  // UAE mobile without prefix: 5XXXXXXXX (9 digits, starts with 5)
  if (stripped.startsWith('5') && stripped.length === 9) return `+971${stripped}`

  // Fallback: prepend +
  return `+${stripped}`
}

export function formatPhone(phone: string | null): string {
  const e164 = normalizePhone(phone)
  if (!e164) return '—'
  // UAE: +971 5X XXX XXXX
  if (e164.startsWith('+971') && e164.length === 13) {
    return `+971 ${e164.slice(4, 6)} ${e164.slice(6, 9)} ${e164.slice(9)}`
  }
  return e164
}

export function getWhatsAppUrl(phone: string | null): string {
  const e164 = normalizePhone(phone)
  if (!e164) return '#'
  return `https://wa.me/${e164.slice(1)}` // wa.me expects no leading +
}

export function getCallUrl(phone: string | null): string {
  const e164 = normalizePhone(phone)
  return e164 ? `tel:${e164}` : '#'
}
export function statusLabel(status: OwnerStatus | null): string {
  const map: Record<OwnerStatus, string> = { new: 'New', cold: 'Cold', warm: 'Warm', hot: 'Hot', contacted: 'Contacted', not_interested: 'Not Interested', closed: 'Closed' }
  return status ? map[status] ?? status : 'New'
}
export function statusColor(status: OwnerStatus | null): string {
  const map: Record<OwnerStatus, string> = { new: 'bg-slate-700 text-slate-300', cold: 'bg-blue-900 text-blue-300', warm: 'bg-amber-900 text-amber-300', hot: 'bg-red-900 text-red-300', contacted: 'bg-green-900 text-green-300', not_interested: 'bg-zinc-800 text-zinc-400', closed: 'bg-purple-900 text-purple-300' }
  return status ? map[status] ?? 'bg-slate-700 text-slate-300' : 'bg-slate-700 text-slate-300'
}
export function confidenceColor(score: number | null): string {
  if (!score) return 'text-zinc-500'
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}
export function initials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
