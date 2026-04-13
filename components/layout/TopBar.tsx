'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { initials } from '@/lib/utils'
import { LogOut } from 'lucide-react'

interface TopBarProps {
  agentName?: string | null
  agentRole?: string | null
}

export function TopBar({ agentName, agentRole }: TopBarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="md:hidden flex items-center justify-between px-4 pt-12 pb-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
          <span className="text-[9px] font-bold text-[#0D0F0E]">
            {initials(agentName ?? null)}
          </span>
        </div>
        <span className="text-sm font-medium text-[#E8ECE8]">{agentName ?? 'Agent'}</span>
        {agentRole === 'admin' && (
          <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A84C] text-[#0D0F0E] rounded font-bold uppercase tracking-wide">Admin</span>
        )}
      </div>
      <button onClick={handleLogout}
        className="flex items-center gap-1.5 text-xs text-[#555D55] py-1.5 px-3 bg-[#1A1D1A] border border-[#252825] rounded-lg active:bg-[#252825]">
        <LogOut size={12} />Sign out
      </button>
    </div>
  )
}
