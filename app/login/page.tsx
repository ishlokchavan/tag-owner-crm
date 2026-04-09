'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0F0E] flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1e2a1e 0%, #0D0F0E 70%)' }}>
      <div className="w-14 h-14 border border-[#C9A84C] rounded-full flex items-center justify-center mb-6 relative">
        <div className="absolute inset-[5px] border border-[#8a6e2f] rounded-full opacity-50" />
        <span className="text-[#C9A84C] font-semibold text-lg tracking-wide">TAG</span>
      </div>
      <h1 className="text-2xl font-semibold text-[#E8ECE8] mb-1 tracking-tight">Welcome back</h1>
      <p className="text-sm text-[#555D55] mb-8">Sign in to TAG CRM</p>
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#8A918A] uppercase tracking-wide mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@aga.ae" required
            className="w-full bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3 text-sm text-[#E8ECE8] placeholder:text-[#555D55] outline-none focus:border-[#C9A84C] transition-colors" />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#8A918A] uppercase tracking-wide mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            className="w-full bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3 text-sm text-[#E8ECE8] placeholder:text-[#555D55] outline-none focus:border-[#C9A84C] transition-colors" />
        </div>
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-300">{error}</div>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-[#C9A84C] text-[#0D0F0E] rounded-xl font-semibold text-sm disabled:opacity-50 active:opacity-80">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="mt-8 text-xs text-[#555D55] text-center">AGA Real Estate · TAG Owner Intelligence</p>
    </div>
  )
}
