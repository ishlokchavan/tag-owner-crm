'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { initials } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Phone, TrendingUp, BarChart2, LogOut } from 'lucide-react'

const NAV = [
  { href: '/dashboard',  label: 'Home',       icon: LayoutDashboard },
  { href: '/owners',     label: 'Owners',     icon: Users },
  { href: '/call-queue', label: 'Call Queue', icon: Phone },
  { href: '/investors',  label: 'Investors',  icon: TrendingUp },
  { href: '/activity',   label: 'Activity',   icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('agent_profiles').select('name, role').eq('id', user.id).single()
        .then(({ data }) => {
          setName(data?.name || user.email?.split('@')[0] || 'Agent')
          setRole(data?.role ?? null)
        })
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-60 bg-[#0D0F0E] border-r border-[#252825] z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#252825]">
        <h1 className="text-base font-bold text-[#E8ECE8] tracking-tight">TAG CRM</h1>
        <p className="text-xs text-[#555D55] mt-0.5">Tilal Al Ghaf · Owner Intelligence</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                active
                  ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                  : 'text-[#555D55] hover:text-[#E8ECE8] hover:bg-[#1A1D1A]'
              }`}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Agent + sign out */}
      <div className="px-4 py-4 border-t border-[#252825]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#0D0F0E]">{initials(name ?? null)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#E8ECE8] truncate">{name ?? 'Agent'}</p>
            {role === 'admin' && (
              <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A84C] text-[#0D0F0E] rounded font-bold uppercase tracking-wide">Admin</span>
            )}
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#555D55] hover:text-[#E8ECE8] hover:bg-[#1A1D1A] transition-colors">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  )
}
