'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, UtensilsCrossed, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login state
  const [loginHotelName, setLoginHotelName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [hotelName, setHotelName] = useState('')
  const [hotelPhone, setHotelPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginHotelName.trim() || !loginPassword) return
    setLoading(true)
    setError('')

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
      setError(data.error || 'Invalid credentials')
      setLoading(false)
      return
    }

    router.push('/menu')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelName.trim() || !registerPassword) return
    setLoading(true)
    setError('')

    // 1. Create Hotel with username derived from hotel name
    const res = await fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: hotelName.trim(),
        phone: hotelPhone,
        address: '', // Removed from requirements
        username: hotelName.toLowerCase().trim(),
        password: registerPassword,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create hotel')
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

    router.push('/menu')
  }

  return (
    <main className="min-h-screen bg-luxury-pattern flex flex-col md:flex-row font-sans">
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
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 text-gold-500 flex items-center justify-center shadow-lg backdrop-blur-md">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="font-sans text-xl font-bold tracking-wider text-white">
            Guest<span className="text-gold-500">QR</span>
          </span>
        </div>

        {/* Branding text */}
        <div className="relative z-10 max-w-lg px-8 text-left space-y-6 animate-fade-in-up">
          <span className="inline-block px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-gold-500 bg-gold-500/10 border border-gold-500/20 rounded-full">
            Hospitality Suite
          </span>
          <h2 className="text-4xl lg:text-5xl font-sans font-extrabold text-white leading-tight tracking-tight">
            Craft Extraordinary <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-500 to-gold-200">
              Dining Experiences
            </span>
          </h2>
          <p className="text-cream-200/80 leading-relaxed font-light text-base">
            Empower your hotel or restaurant with seamless, elegant contactless QR code menus. Control orders, update listings, and delight your guests in real-time.
          </p>
          <div className="pt-4 flex items-center gap-4 text-xs font-semibold text-cream-200/50">
            <span>✓ Instantly Generated QR</span>
            <span>•</span>
            <span>✓ Live Order Feed</span>
            <span>•</span>
            <span>✓ Elegant Custom Styling</span>
          </div>
        </div>
        
        {/* Subtle corner light source */}
        <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Right Side: Authentication Portal */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center gap-2 mb-8 animate-fade-in-up">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 text-gold-500 flex items-center justify-center shadow-md">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h1 className="font-sans text-2xl font-bold tracking-wider text-white">
            Guest<span className="text-gold-500">QR</span>
          </h1>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Section title */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Restaurant'}
            </h2>
            <p className="text-gray-400 text-sm font-medium">
              {activeTab === 'login' 
                ? 'Sign in to access your digital menu dashboard' 
                : 'Get started and deploy your QR menu in minutes'}
            </p>
          </div>

          {/* Form Container Card */}
          <div className="bg-[#121212]/90 border border-gold-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-gold-500/5 backdrop-blur-md relative">
            
            {/* Tabs */}
            <div className="flex bg-obsidian-950/80 p-1 rounded-2xl mb-8 border border-gold-500/10">
              <button
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'login' 
                    ? 'bg-gold-500 text-obsidian-950 shadow-md border border-gold-500 shadow-gold-500/15' 
                    : 'text-gray-400 hover:text-gold-200'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'register' 
                    ? 'bg-gold-500 text-obsidian-950 shadow-md border border-gold-500 shadow-gold-500/15' 
                    : 'text-gray-400 hover:text-gold-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-start gap-3 animate-fade-in-up">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gold-500/80 mb-2 uppercase tracking-wider">Hotel Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Store className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginHotelName}
                      onChange={(e) => setLoginHotelName(e.target.value)}
                      className="w-full bg-obsidian-950 border border-gold-500/25 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 transition-all font-semibold text-sm"
                      placeholder="e.g. Grand Plaza Hotel"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gold-500/80 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/25 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 transition-all font-semibold text-sm"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold py-4 rounded-2xl shadow-lg shadow-gold-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-8 flex items-center justify-center gap-2 cursor-pointer border border-gold-650"
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
                  <label className="block text-xs font-bold text-gold-500/80 mb-2 uppercase tracking-wider">Hotel Name</label>
                  <input
                    type="text"
                    required
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/25 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 transition-all font-semibold text-sm"
                    placeholder="e.g. Grand Plaza Hotel"
                  />
                  <p className="text-[10px] text-gold-200/40 mt-1.5 font-medium">Your hotel name will be used to generate your login ID.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gold-500/80 mb-2 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={hotelPhone}
                    onChange={(e) => setHotelPhone(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/25 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 transition-all font-semibold text-sm"
                    placeholder="+1 (234) 567-8900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gold-500/80 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full bg-obsidian-950 border border-gold-500/25 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 transition-all font-semibold text-sm"
                    placeholder="Create a strong password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold py-4 rounded-2xl shadow-lg shadow-gold-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-8 flex items-center justify-center gap-2 cursor-pointer border border-gold-650"
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
    </main>
  )
}
