'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, MapPin, CheckCircle2, ShoppingBag, X, Minus, Plus, 
  UtensilsCrossed, Copy, Clock, Sparkles, RefreshCw, Phone, 
  ChefHat, ChevronRight, AlertCircle, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  available: boolean
  description?: string
  image_url?: string
}

const getFallbackCategoryImg = (category: string = '', name: string = '') => {
  const query = `${name} ${category}`.toLowerCase()
  if (query.includes('biryani') || query.includes('rice') || query.includes('pulao')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80'
  }
  if (query.includes('chicken') || query.includes('mutton') || query.includes('meat') || query.includes('curry') || query.includes('gravy')) {
    return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&auto=format&fit=crop&q=80'
  }
  if (query.includes('paneer') || query.includes('starter') || query.includes('tikka') || query.includes('fry') || query.includes('kebab')) {
    return 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=300&auto=format&fit=crop&q=80'
  }
  if (query.includes('drink') || query.includes('beverage') || query.includes('juice') || query.includes('tea') || query.includes('coffee') || query.includes('soda')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80'
  }
  if (query.includes('dessert') || query.includes('sweet') || query.includes('cake') || query.includes('ice') || query.includes('gulab')) {
    return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&auto=format&fit=crop&q=80'
  }
  if (query.includes('bread') || query.includes('naan') || query.includes('roti') || query.includes('paratha')) {
    return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&auto=format&fit=crop&q=80'
  }
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=80'
}

const getItemImageUrl = (item: MenuItem) => {
  if (item.image_url && item.image_url.trim().length > 0) {
    return item.image_url.trim()
  }
  return getFallbackCategoryImg(item.category, item.name)
}

interface Hotel {
  id: string
  name: string
  phone: string
  address: string
}

interface CartItem {
  item: MenuItem
  quantity: number
}

interface DeviceOrderItem {
  id?: string
  name: string
  price: number
  quantity: number
}

interface DeviceOrder {
  id: string
  room_no: string
  status: string
  created_at: string
  items: DeviceOrderItem[]
  hotel_id: string
}

export default function MenuPage({
  params,
}: {
  params: Promise<{ hotel_id: string }>
}) {
  const { hotel_id } = use(params)

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // View state: 'menu' or 'orders'
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Cart
  const [cart, setCart] = useState<{ [id: string]: CartItem }>({})
  const [roomNo, setRoomNo] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null)
  const [cartExpanded, setCartExpanded] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Device Orders State
  const [deviceOrders, setDeviceOrders] = useState<DeviceOrder[]>([])
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false)

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Load device-specific order history
  const loadDeviceOrders = useCallback(async () => {
    if (!hotel_id) return
    try {
      setIsRefreshingOrders(true)
      const storageKey = `hotel_device_orders_${hotel_id}`
      const savedIdsRaw = localStorage.getItem(storageKey)
      if (!savedIdsRaw) {
        setDeviceOrders([])
        return
      }

      const savedIds: string[] = JSON.parse(savedIdsRaw)
      if (!Array.isArray(savedIds) || savedIds.length === 0) {
        setDeviceOrders([])
        return
      }

      const res = await fetch(`/api/orders?ids=${encodeURIComponent(savedIds.join(','))}`)
      if (res.ok) {
        const data = await res.json()
        setDeviceOrders(data.orders || [])
      }
    } catch {
      // Ignore background fetch errors
    } finally {
      setIsRefreshingOrders(false)
    }
  }, [hotel_id])

  // Save new order ID to local storage for this device
  const saveDeviceOrderId = (orderId: string) => {
    if (!hotel_id) return
    const storageKey = `hotel_device_orders_${hotel_id}`
    const existingRaw = localStorage.getItem(storageKey)
    let existingIds: string[] = []
    try {
      if (existingRaw) existingIds = JSON.parse(existingRaw)
    } catch {
      existingIds = []
    }
    if (!existingIds.includes(orderId)) {
      const updated = [orderId, ...existingIds]
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }
    loadDeviceOrders()
  }

  // Initial Fetch menu & hotel info
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        // Fetch hotel info
        const hotelRes = await fetch(`/api/hotels?hotel_id=${hotel_id}`)
        if (!hotelRes.ok) throw new Error('Hotel not found')
        const hotelData = await hotelRes.json()
        setHotel(hotelData.hotel)

        // Fetch menu items
        const menuRes = await fetch(`/api/menu?hotel_id=${hotel_id}`)
        if (!menuRes.ok) throw new Error('Failed to load menu items')
        const menuData = await menuRes.json()
        setItems(menuData.items || [])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An error occurred while loading'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    if (hotel_id) {
      loadData()
      loadDeviceOrders()
    }
  }, [hotel_id, loadDeviceOrders])

  // Auto-refresh order status every 12 seconds when viewing orders or when there are active orders
  useEffect(() => {
    if (deviceOrders.length === 0) return
    const interval = setInterval(() => {
      loadDeviceOrders()
    }, 12000)
    return () => clearInterval(interval)
  }, [deviceOrders.length, loadDeviceOrders])

  // Categories list
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))]

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Cart actions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const current = prev[item.id]
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: current ? current.quantity + 1 : 1,
        },
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const current = prev[itemId]
      if (!current) return prev
      if (current.quantity === 1) {
        const copy = { ...prev }
        delete copy[itemId]
        return copy
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      }
    })
  }

  const getCartTotalQuantity = () => {
    return Object.values(cart).reduce((total, c) => total + c.quantity, 0)
  }

  const getCartTotalPrice = () => {
    return Object.values(cart).reduce((total, c) => total + c.item.price * c.quantity, 0)
  }

  const [guestToast, setGuestToast] = useState<{ id: string; type: 'success' | 'error'; title: string; message: string } | null>(null)

  const showGuestToast = (type: 'success' | 'error', title: string, message: string) => {
    setGuestToast({ id: Date.now().toString(), type, title, message })
    setTimeout(() => setGuestToast(null), 4000)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomNo.trim()) return
    const cartItems = Object.values(cart).map(c => ({
      id: c.item.id,
      name: c.item.name,
      price: c.item.price,
      quantity: c.quantity,
    }))

    if (cartItems.length === 0) return

    setIsOrdering(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id,
          room_no: roomNo.trim(),
          items: cartItems,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit order')

      showGuestToast('success', 'Order Placed Successfully', 'Your kitchen order has been sent directly to the staff!')
      
      // Save order to device-specific order history
      saveDeviceOrderId(data.order_id)

      setOrderSuccessId(data.order_id)
      setCart({})
      setCartExpanded(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      showGuestToast('error', 'Order Error', msg)
    } finally {
      setIsOrdering(false)
    }
  }

  // Active orders count for badge
  const activeOrdersCount = deviceOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length

  if (loading) {
    return (
      <main className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-3 border-gold-500 border-t-transparent rounded-full mb-4 shadow-lg shadow-gold-500/20"
        />
        <p className="text-gold-200 text-sm font-semibold tracking-wide animate-pulse">Loading Guest Menu...</p>
      </main>
    )
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="p-5 bg-red-950/40 border border-red-500/30 text-red-400 rounded-full mb-4 shadow-xl">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Menu Unavailable</h1>
        <p className="text-gray-400 text-sm max-w-sm mb-8">{error || "We couldn't load the menu for this hotel."}</p>
        <Link
          href="/"
          className="bg-gold-500 text-obsidian-950 hover:bg-gold-600 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-gold-500/20"
        >
          Return to Home
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-obsidian-950 text-cream-50 font-sans pb-32">
      {/* 
        PREMIUM RESPONSIVE TOPBAR HEADER (No food background image)
        Modern dark luxury layout with ambient glow and clean typography 
      */}
      <header className="relative bg-gradient-to-b from-obsidian-900 via-obsidian-950 to-obsidian-950 border-b border-gold-500/15 pt-8 pb-6 px-4 sm:px-6 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10 space-y-5">
          {/* Hotel Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold-500/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-gold-500/10 border border-gold-500/25 text-gold-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  QR In-Room Dining
                </span>
                <span className="inline-flex items-center gap-1 bg-green-950/40 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Kitchen Open
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {hotel.name}
              </h1>
              {hotel.address && (
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span className="truncate">{hotel.address}</span>
                </p>
              )}
            </div>

            {hotel.phone && (
              <a
                href={`tel:${hotel.phone}`}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-obsidian-900 hover:bg-obsidian-850 text-gold-300 border border-gold-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-gold-400" />
                <span>Front Desk</span>
              </a>
            )}
          </div>

          {/* Navigation Tab Switcher: Menu vs My Orders */}
          <div className="grid grid-cols-2 bg-obsidian-900/90 p-1.5 rounded-2xl border border-gold-500/20 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setActiveTab('menu')}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer",
                activeTab === 'menu'
                  ? "bg-gold-500 text-obsidian-950 shadow-md shadow-gold-500/15"
                  : "text-gray-400 hover:text-white hover:bg-obsidian-800/50"
              )}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu Options</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders')
                loadDeviceOrders()
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer relative",
                activeTab === 'orders'
                  ? "bg-gold-500 text-obsidian-950 shadow-md shadow-gold-500/15"
                  : "text-gray-400 hover:text-white hover:bg-obsidian-800/50"
              )}
            >
              <Clock className="w-4 h-4" />
              <span>My Orders</span>
              {deviceOrders.length > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-black ml-1 inline-flex items-center justify-center min-w-5 h-5 leading-none transition-all shadow-sm",
                  activeTab === 'orders'
                    ? "bg-gold-600/30 text-obsidian-950 border border-obsidian-950/25"
                    : activeOrdersCount > 0
                    ? "bg-gold-500 text-obsidian-950 font-extrabold animate-pulse"
                    : "bg-obsidian-800 text-gold-200 border border-gold-500/20"
                )}>
                  {deviceOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* VIEW 1: CULINARY MENU OPTIONS */}
        {activeTab === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search Input */}
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
                <Search className="w-4.5 h-4.5 group-focus-within:text-gold-400 transition-colors" />
              </span>
              <input
                type="text"
                placeholder="Search dishes, beverages, starters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian-900 border border-gold-500/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category horizontal scrolling bar */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 border-b border-gold-500/15">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all duration-200 border cursor-pointer",
                    selectedCategory === cat
                      ? "bg-gold-500 text-obsidian-950 border-gold-500 shadow-md shadow-gold-500/10"
                      : "bg-obsidian-900 text-gray-400 border-gold-500/10 hover:border-gold-500/40 hover:text-gold-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Title & Items Counter */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-white flex items-center gap-2 tracking-tight">
                <UtensilsCrossed className="w-4.5 h-4.5 text-gold-500" />
                {selectedCategory === 'All' ? 'Culinary Selections' : selectedCategory}
              </h2>
              <span className="text-xs text-gold-400/80 font-medium">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
              </span>
            </div>

            {/* Menu Items Cards Grid */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-14 text-center bg-obsidian-900/60 border border-gold-500/15 rounded-3xl p-6"
                  >
                    <div className="w-14 h-14 bg-obsidian-950 rounded-full flex items-center justify-center mx-auto mb-3 border border-gold-500/15">
                      <Search className="w-6 h-6 text-gold-500/50" />
                    </div>
                    <p className="text-white font-bold">No dishes found</p>
                    <p className="text-xs text-gray-400 mt-1">Try modifying your search query or category filter.</p>
                  </motion.div>
                ) : (
                  filteredItems.map((item, index) => {
                    const cartItem = cart[item.id]
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={item.id}
                        className="p-3.5 sm:p-5 bg-obsidian-900 border border-gold-500/15 rounded-3xl flex justify-between items-center shadow-md hover:border-gold-500/35 transition-all gap-3 sm:gap-4"
                      >
                        {/* Product Image Thumbnail */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-gold-500/20 shadow-md bg-obsidian-950">
                          <img
                            src={getItemImageUrl(item)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackCategoryImg(item.category, item.name)
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/40 via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Item Details */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Veg Icon Badge */}
                            <div className="w-3.5 h-3.5 border border-green-500 flex items-center justify-center rounded-[3px] p-[1px] bg-green-950/30 shrink-0">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            </div>
                            {item.category && (
                              <span className="text-[9px] text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider truncate max-w-[120px]">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-white text-sm sm:text-base leading-snug tracking-tight line-clamp-1">{item.name}</h3>
                          {item.description && (
                            <p className="text-gray-400 text-xs font-normal leading-relaxed line-clamp-2">{item.description}</p>
                          )}
                          <p className="font-extrabold text-gold-400 text-sm sm:text-base pt-0.5">₹{item.price}</p>
                        </div>

                        {/* Add / Quantity Control */}
                        <div className="flex flex-col items-center justify-center shrink-0">
                          {cartItem ? (
                            <div className="flex items-center bg-obsidian-950 border border-gold-500/30 rounded-2xl shadow-inner overflow-hidden w-20 sm:w-24 h-9 sm:h-10">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="flex-1 h-full flex items-center justify-center text-gold-400 hover:bg-gold-500/10 transition cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-extrabold text-gold-300 text-xs sm:text-sm">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="flex-1 h-full flex items-center justify-center text-gold-400 hover:bg-gold-500/10 transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="bg-gold-500/10 hover:bg-gold-500 hover:text-obsidian-950 border border-gold-500/40 text-gold-400 font-bold px-4 sm:px-6 py-2 rounded-2xl text-xs transition-all active:scale-95 cursor-pointer w-20 sm:w-24 h-9 sm:h-10 shadow-sm flex items-center justify-center"
                            >
                              ADD
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: DEVICE-SPECIFIC ORDERS HISTORY ("MY ORDERS") */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header & Refresh */}
            <div className="flex items-center justify-between border-b border-gold-500/15 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-gold-400" />
                  My Device Orders
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Orders placed directly from this phone
                </p>
              </div>

              <button
                onClick={loadDeviceOrders}
                disabled={isRefreshingOrders}
                className="flex items-center gap-1.5 bg-obsidian-900 border border-gold-500/20 text-gold-300 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-obsidian-850 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshingOrders && "animate-spin text-gold-400")} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Device Orders List */}
            {deviceOrders.length === 0 ? (
              <div className="py-16 text-center bg-obsidian-900/60 border border-gold-500/15 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 bg-obsidian-950 rounded-full flex items-center justify-center mx-auto border border-gold-500/20 text-gold-500/60">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">No Orders Placed Yet</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    When you order food via this menu, your order history and live kitchen updates will appear here.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="bg-gold-500 text-obsidian-950 font-bold px-6 py-2.5 rounded-2xl text-xs transition hover:bg-gold-400 cursor-pointer shadow-md shadow-gold-500/10 inline-flex items-center gap-1.5"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Browse Culinary Menu</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {deviceOrders.map((ord) => {
                  const totalPrice = (ord.items || []).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)
                  const isPending = ord.status === 'pending'
                  const isPreparing = ord.status === 'preparing'
                  const isCompleted = ord.status === 'completed'

                  return (
                    <div
                      key={ord.id}
                      className="bg-obsidian-900 border border-gold-500/20 rounded-3xl p-5 space-y-4 shadow-lg"
                    >
                      {/* Order Slip Top Bar */}
                      <div className="flex items-center justify-between border-b border-gold-500/10 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">
                              Suite / Room {ord.room_no}
                            </span>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-xs text-gray-400 font-mono">
                              {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-300 font-mono font-bold">
                              #{ord.id.slice(0, 8)}
                            </code>
                            <button
                              onClick={() => handleCopyCode(ord.id)}
                              className="text-[10px] text-gold-400 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedCode === ord.id ? 'Copied!' : 'Copy Code'}
                            </button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              Pending
                            </span>
                          )}
                          {isPreparing && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              Preparing
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                              Completed
                            </span>
                          )}
                          {!isPending && !isPreparing && !isCompleted && (
                            <span className="inline-flex items-center gap-1.5 bg-gray-500/10 border border-gray-500/30 text-gray-300 px-3 py-1 rounded-full text-xs font-bold capitalize">
                              {ord.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 divide-y divide-gold-500/5">
                        {(ord.items || []).map((it, idx) => (
                          <div key={idx} className={cn("flex justify-between items-center text-xs pt-1.5", idx === 0 && "pt-0")}>
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-obsidian-950 text-gold-400 font-bold rounded-md flex items-center justify-center text-[11px] border border-gold-500/20">
                                {it.quantity}x
                              </span>
                              <span className="text-white font-semibold">{it.name}</span>
                            </div>
                            <span className="text-gold-300 font-bold">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary Foot */}
                      <div className="flex items-center justify-between pt-3 border-t border-gold-500/10 text-xs">
                        <span className="text-gray-400">Total Charged to Suite</span>
                        <span className="font-extrabold text-gold-400 text-sm">₹{totalPrice}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* FLOATING CART BANNER */}
      <AnimatePresence>
        {activeTab === 'menu' && getCartTotalQuantity() > 0 && !cartExpanded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4"
          >
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setCartExpanded(true)}
                className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian-950 rounded-2xl shadow-xl shadow-gold-500/15 p-4 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer border border-gold-300"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-obsidian-950/80 uppercase tracking-widest">
                    {getCartTotalQuantity()} {getCartTotalQuantity() === 1 ? 'Plate' : 'Plates'} Selected
                  </span>
                  <span className="font-extrabold text-lg text-obsidian-950">
                    ₹{getCartTotalPrice()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide uppercase text-obsidian-950">
                  Review Order Bag <ShoppingBag className="w-4 h-4 text-obsidian-950" />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT DRAWER (Bottom Sheet) */}
      <AnimatePresence>
        {cartExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartExpanded(false)}
              className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-obsidian-900 border-t border-gold-500/30 rounded-t-[32px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="max-w-2xl mx-auto w-full h-full flex flex-col text-cream-50">
                {/* Drawer Header */}
                <div className="px-6 pt-5 pb-3.5 border-b border-gold-500/15 flex items-center justify-between bg-obsidian-900">
                  <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-4.5 h-4.5 text-gold-400" />
                    Your Order Bag
                  </h3>
                  <button
                    onClick={() => setCartExpanded(false)}
                    className="p-2 bg-obsidian-950 hover:bg-obsidian-800 text-gray-400 border border-gold-500/20 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gold-400" />
                  </button>
                </div>

                {/* Items List */}
                <div className="px-6 py-2 overflow-y-auto max-h-[36vh] space-y-3 divide-y divide-gold-500/5">
                  {Object.values(cart).map((c, idx) => (
                    <div key={c.item.id} className={cn("flex justify-between items-center py-3", idx === 0 && "pt-1")}>
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 border border-green-500 flex items-center justify-center rounded-[3px] shrink-0 p-[1px] bg-green-950/30">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm leading-snug">{c.item.name}</p>
                          <p className="text-gold-400 text-xs font-bold mt-0.5">₹{c.item.price}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-obsidian-950 border border-gold-500/20 rounded-xl shadow-sm h-8 w-[76px]">
                           <button
                             onClick={() => removeFromCart(c.item.id)}
                             className="flex-1 h-full flex items-center justify-center text-gold-400 hover:bg-gold-500/10 cursor-pointer"
                           >
                             <Minus className="w-3 h-3" />
                           </button>
                           <span className="font-bold text-gold-300 text-xs">
                             {c.quantity}
                           </span>
                           <button
                             onClick={() => addToCart(c.item)}
                             className="flex-1 h-full flex items-center justify-center text-gold-400 hover:bg-gold-500/10 cursor-pointer"
                           >
                             <Plus className="w-3 h-3" />
                           </button>
                        </div>
                        <span className="font-bold text-gold-400 w-14 text-right text-sm">
                          ₹{c.item.price * c.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(cart).length === 0 && (
                    <div className="py-12 text-center text-gray-400 font-medium">
                      Your order bag is currently empty.
                    </div>
                  )}
                </div>

                {/* Subtotal */}
                {Object.keys(cart).length > 0 && (
                  <div className="px-6 py-3.5 bg-obsidian-950 border-t border-b border-gold-500/15">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Items Subtotal</span>
                      <span className="font-bold text-white">₹{getCartTotalPrice()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2 border-b border-gold-500/10 pb-2">
                      <span>Service & Delivery</span>
                      <span className="text-green-400 font-bold text-[10px] uppercase bg-green-950/30 px-2 py-0.5 rounded border border-green-500/30">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>Grand Total</span>
                      <span className="font-extrabold text-gold-400 text-base">₹{getCartTotalPrice()}</span>
                    </div>
                  </div>
                )}

                {/* Room Number & Confirm Order */}
                <div className="p-4 bg-obsidian-900 border-t border-gold-500/15">
                  <form onSubmit={handlePlaceOrder} className="space-y-3.5">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Enter Room / Suite Number (e.g. 302)"
                        value={roomNo}
                        onChange={(e) => setRoomNo(e.target.value)}
                        className="w-full bg-obsidian-950 border border-gold-500/25 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all font-semibold"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isOrdering || Object.keys(cart).length === 0}
                      className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold py-4 px-6 rounded-2xl shadow-xl shadow-gold-500/15 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-between border border-gold-300"
                    >
                      {isOrdering ? (
                        <div className="flex items-center justify-center w-full gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-obsidian-950 border-t-transparent rounded-full" />
                          <span className="text-xs uppercase tracking-wider font-bold">Transmitting Order...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs uppercase tracking-widest font-bold">Confirm & Send Order</span>
                          <span className="font-bold bg-gold-600 px-3 py-1 rounded-lg text-sm text-obsidian-950">
                            ₹{getCartTotalPrice()}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {orderSuccessId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-obsidian-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 180 }}
              className="w-full max-w-md text-center space-y-6 bg-obsidian-900 border border-gold-500/30 p-8 rounded-[32px] shadow-2xl text-cream-50"
            >
              <div className="w-20 h-20 mx-auto bg-green-950/40 border border-green-500/40 rounded-full flex items-center justify-center shadow-lg shadow-green-500/10">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-white tracking-tight">Order Transmitted!</h2>
                <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
                  Your food order has been logged and sent directly to the hotel kitchen.
                </p>
              </div>

              <div className="bg-obsidian-950 border border-gold-500/20 rounded-2xl p-4 text-left shadow-inner">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-gold-400 font-bold uppercase tracking-wider">Kitchen Order Reference</span>
                  <span className="text-[10px] text-gray-400 font-mono">Order Code</span>
                </div>
                
                <div className="flex items-center gap-2 bg-obsidian-900 border border-gold-500/20 rounded-xl p-2.5">
                  <code className="text-gold-300 font-mono text-xs sm:text-sm font-bold flex-1 truncate select-all px-1">
                    {orderSuccessId}
                  </code>
                  <button 
                    type="button"
                    onClick={() => handleCopyCode(orderSuccessId)}
                    className={cn(
                      "font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border",
                      copiedCode === orderSuccessId 
                        ? "bg-green-500/20 text-green-400 border-green-500/40" 
                        : "bg-gold-500/20 text-gold-300 border-gold-500/30 hover:bg-gold-500/30"
                    )}
                  >
                    {copiedCode === orderSuccessId ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gold-400" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setOrderSuccessId(null)
                    setActiveTab('orders')
                    loadDeviceOrders()
                  }}
                  className="bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold py-3 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wider shadow-md"
                >
                  View My Orders
                </button>

                <button
                  onClick={() => setOrderSuccessId(null)}
                  className="bg-obsidian-950 hover:bg-obsidian-850 text-gray-300 border border-gold-500/20 font-bold py-3 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wider"
                >
                  Back to Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GUEST TOAST NOTIFICATIONS */}
      {guestToast && (
        <div className="fixed bottom-6 right-6 z-[250] max-w-sm w-full px-4 sm:px-0 pointer-events-none">
          <div className={cn(
            "pointer-events-auto border rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in-up flex items-start justify-between gap-3 text-white transition-all",
            guestToast.type === 'error' ? "bg-red-950/90 border-red-500/40 text-red-100" : "bg-obsidian-900/95 border-gold-500/40"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                guestToast.type === 'error' ? "bg-red-900/30 border-red-500/40 text-red-400" : "bg-green-950/30 border-green-500/40 text-green-400"
              )}>
                {guestToast.type === 'error' ? <X className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider block",
                  guestToast.type === 'error' ? "text-red-400" : "text-gold-400"
                )}>
                  {guestToast.title}
                </span>
                <p className="font-bold text-xs sm:text-sm text-white mt-0.5">{guestToast.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setGuestToast(null)}
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