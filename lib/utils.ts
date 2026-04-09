import { OwnerStatus } from '@/types'
export function formatPhone(phone: string | null): string { return phone ? phone.trim() : '—' }
export function getWhatsAppUrl(phone: string | null): string {
  if (!phone) return '#'
  const cleaned = phone.replace(/[^0-9+]/g, '')
  return `https://wa.me/${cleaned.startsWith('+') ? cleaned.slice(1) : cleaned}`
}
export function getCallUrl(phone: string | null): string { return phone ? `tel:${phone.trim()}` : '#' }
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
  const parts = name.trim().split(/s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
