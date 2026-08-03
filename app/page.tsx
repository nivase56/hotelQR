'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, UtensilsCrossed, ArrowRight, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthToast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<AuthToast | null>(null)

  // Login state
  const [loginHotelName, setLoginHotelName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [hotelName, setHotelName] = useState('')
  const [hotelPhone, setHotelPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ id: Date.now().toString(), type, title, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginHotelName.trim() || !loginPassword) return
    setLoading(true)
    setError('')
    showToast('info', 'Signing In...', 'Verifying your credentials')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginHotelName.toLowerCase().trim(),
          password: loginPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data.error || 'Invalid credentials'
        setError(errMsg)
        showToast('error', 'Sign In Failed', errMsg)
        setLoading(false)
        return
      }

      showToast('success', 'Sign In Successful', 'Welcome back! Opening your dashboard...')
      setTimeout(() => {
        router.push('/menu')
      }, 500)
    } catch {
      setError('Connection failed. Please try again.')
      showToast('error', 'Network Error', 'Connection failed')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelName.trim() || !registerPassword) return
    setLoading(true)
    setError('')
    showToast('info', 'Creating Account...', 'Setting up your hospitality portal')

    try {
      // 1. Create Hotel with username derived from hotel name
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hotelName.trim(),
          phone: hotelPhone,
          address: '',
          username: hotelName.toLowerCase().trim(),
          password: registerPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data.error || 'Failed to create account'
        setError(errMsg)
        showToast('error', 'Sign Up Failed', errMsg)
        setLoading(false)
        return
      }

      // 2. Login automatically
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: hotelName.toLowerCase().trim(),
          password: registerPassword,
        }),
      })

      showToast('success', 'Account Created!', 'Restaurant registered successfully. Redirecting...')
      setTimeout(() => {
        router.push('/menu')
      }, 500)
    } catch {
      setError('Connection failed. Please try again.')
      showToast('error', 'Network Error', 'Connection failed')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-yellow-dots flex flex-col md:flex-row font-sans">
      {/* Left Side: Premium Brand Showcase (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 relative bg-obsidian-950 items-center justify-center overflow-hidden">
        {/* Background Image with elegant overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-85 scale-105 transition-transform duration-[10000ms] hover:scale-100"
          style={{ backgroundImage: "url('/dining_experience.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-900/60 to-transparent" />
        
        {/* Decorative Gold Elements */}
        <div className="absolute top-8 left-8 flex items-center gap-2.5 z-10">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient text-obsidian-950 flex items-center justify-center shadow-lg backdrop-blur-md">
            <UtensilsCrossed className="w-5 h-5 text-obsidian-950" />
          </div>
          <span className="font-sans text-xl font-black tracking-wider text-white">
            Guest<span className="text-gold-gradient">QR</span>
          </span>
        </div>

        {/* Branding text */}
        <div className="relative z-10 max-w-lg px-8 text-left space-y-6 animate-fade-in-up">
          <span className="inline-block px-3.5 py-1 text-xs font-black uppercase tracking-widest text-obsidian-950 bg-gold-gradient rounded-full shadow-md">
            Hospitality Suite
          </span>
          <h2 className="text-4xl lg:text-5xl font-sans font-extrabold text-white leading-tight tracking-tight">
            Craft Extraordinary <br />
            <span className="text-gold-gradient">
              Dining Experiences
            </span>
          </h2>
          <p className="text-yellow-100/90 leading-relaxed font-normal text-base">
            Empower your hotel or restaurant with seamless, elegant contactless QR code menus. Control orders, update listings, and delight your guests in real-time.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-2.5 text-xs font-extrabold text-gold-300">
            <span className="bg-obsidian-900/90 border border-gold-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-300 shrink-0" />
              Instantly Generated QR
            </span>
            <span className="bg-obsidian-900/90 border border-gold-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-300 shrink-0" />
              Live Order Feed
            </span>
            <span className="bg-obsidian-900/90 border border-gold-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-300 shrink-0" />
              Elegant Custom Styling
            </span>
          </div>
        </div>
        
        {/* Subtle corner light source */}
        <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-gold-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Right Side: Authentication Portal */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center gap-2 mb-8 animate-fade-in-up">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient text-obsidian-950 flex items-center justify-center shadow-md">
            <UtensilsCrossed className="w-5 h-5 text-obsidian-950" />
          </div>
          <h1 className="font-sans text-2xl font-black tracking-wider text-white">
            Guest<span className="text-gold-gradient">QR</span>
          </h1>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Section title */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white tracking-tight">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Restaurant'}
            </h2>
            <p className="text-yellow-100/90 text-sm font-semibold">
              {activeTab === 'login' 
                ? 'Sign in to access your digital menu dashboard' 
                : 'Get started and deploy your QR menu in minutes'}
            </p>
          </div>

          {/* Form Container Card */}
          <div className="bg-obsidian-900/95 border border-gold-500/35 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative">
            
            {/* Tabs */}
            <div className="flex bg-obsidian-950/90 p-1.5 rounded-2xl mb-8 border border-gold-500/30">
              <button
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'login' 
                    ? 'bg-gold-gradient text-obsidian-950 shadow-lg scale-[1.02]' 
                    : 'text-yellow-100/80 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'register' 
                    ? 'bg-gold-gradient text-obsidian-950 shadow-lg scale-[1.02]' 
                    : 'text-yellow-100/80 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-start gap-3 animate-fade-in-up">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold leading-relaxed">{error}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gold-300 mb-2 uppercase tracking-wider">Hotel Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gold-300">
                      <Store className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginHotelName}
                      onChange={(e) => setLoginHotelName(e.target.value)}
                      className="w-full bg-obsidian-950 border border-gold-500/35 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-yellow-100/50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-300 transition-all font-bold text-sm"
                      placeholder="e.g. Grand Plaza Hotel"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gold-300 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/35 rounded-2xl px-4 py-3.5 text-white placeholder-yellow-100/50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-300 transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold-foil font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-8 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <ArrowRight className="w-4 h-4 text-obsidian-950" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gold-300 mb-2 uppercase tracking-wider">Hotel Name</label>
                  <input
                    type="text"
                    required
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/35 rounded-2xl px-4 py-3.5 text-white placeholder-yellow-100/50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-300 transition-all font-bold text-sm"
                    placeholder="e.g. Grand Plaza Hotel"
                  />
                  <p className="text-[10px] text-yellow-100/80 mt-1.5 font-semibold">Your hotel name will be used to generate your login ID.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-gold-300 mb-2 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={hotelPhone}
                    onChange={(e) => setHotelPhone(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/35 rounded-2xl px-4 py-3.5 text-white placeholder-yellow-100/50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-300 transition-all font-bold text-sm"
                    placeholder="+1 (234) 567-8900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gold-300 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/35 rounded-2xl px-4 py-3.5 text-white placeholder-yellow-100/50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-300 transition-all font-bold text-sm"
                    placeholder="Create a strong password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold-foil font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-8 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Establish Account</span>
                      <ArrowRight className="w-4 h-4 text-obsidian-950" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* AUTH TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[250] max-w-sm w-full px-4 sm:px-0 pointer-events-none">
          <div className={cn(
            "pointer-events-auto border rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in-up flex items-start justify-between gap-3 text-white transition-all",
            toast.type === 'error' ? "bg-red-950/95 border-red-500/50 text-red-100 shadow-red-950/50" :
            toast.type === 'success' ? "bg-obsidian-900/95 border-green-500/50 text-white shadow-green-950/30" :
            "bg-obsidian-900/95 border-gold-500/50 text-white shadow-gold-500/10"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                toast.type === 'error' ? "bg-red-900/40 border-red-500/40 text-red-400" :
                toast.type === 'success' ? "bg-green-950/60 border-green-500/40 text-green-400" :
                "bg-gold-500/20 border-gold-500/40 text-gold-300"
              )}>
                {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <span className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider block",
                  toast.type === 'error' ? "text-red-400" :
                  toast.type === 'success' ? "text-green-400" :
                  "text-gold-300"
                )}>
                  {toast.title}
                </span>
                <p className="font-bold text-xs sm:text-sm text-white mt-0.5">{toast.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
