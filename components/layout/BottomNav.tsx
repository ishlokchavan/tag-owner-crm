'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building2, TrendingUp, Phone } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/owners', label: 'Owners', icon: Users },
  { href: '/call-queue', label: 'Call', icon: Phone },
  { href: '/investors', label: 'Investors', icon: TrendingUp },
  { href: '/properties', label: 'Units', icon: Building2 },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#141614] border-t border-[#252825] z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-0 ${active ? 'text-[#C9A84C]' : 'text-[#555D55]'}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium tracking-wide truncate ${active ? 'text-[#C9A84C]' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
