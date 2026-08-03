'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import Link from 'next/link'
import { 
  Store, LogOut, UtensilsCrossed, ListOrdered, QrCode, 
  Plus, Trash2, Eye, EyeOff, Copy, Download, ChevronDown, CheckCircle2, Pencil, X,
  BellRing, Radio, Clock, AlertCircle, Sparkles, ChefHat, Flame, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Hotel {
  id: string
  name: string
  phone: string
  address: string
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  description?: string
  image_url?: string
  available: boolean
}

interface OrderItem {
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  room_no: string
  status: string
  created_at: string
  items: OrderItem[]
}

interface AppToast {
  id: string
  type: 'success' | 'error' | 'info' | 'order'
  title: string
  message: string
  roomNo?: string
  itemsCount?: number
  totalPrice?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'qr'>('menu')

  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ category: 'Main Course', name: '', price: '', description: '', image_url: '', available: true })
  const [customCategory, setCustomCategory] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Orders State & Live Tracking
  const [orders, setOrders] = useState<Order[]>([])
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'completed'>('all')
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null)
  const [toasts, setToasts] = useState<AppToast[]>([])
  const previousOrderIdsRef = useRef<Set<string>>(new Set())
  const isFirstOrderFetch = useRef(true)

  // QR State
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [menuUrl, setMenuUrl] = useState<string>('')

  // Copied state
  const [copied, setCopied] = useState(false)

  // Toast Notification Trigger
  const showToast = (type: 'success' | 'error' | 'info' | 'order', title: string, message: string, extra?: { roomNo?: string; itemsCount?: number; totalPrice?: number }) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6)
    const newToast: AppToast = {
      id,
      type,
      title,
      message,
      roomNo: extra?.roomNo,
      itemsCount: extra?.itemsCount,
      totalPrice: extra?.totalPrice
    }
    setToasts(prev => [newToast, ...prev.slice(0, 4)])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }

  // Luxury Web Audio Chime Sound for live orders
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch {}
  }

  const loadMenu = async (hid: string) => {
    const res = await fetch(`/api/menu?hotel_id=${hid}&admin=true`)
    if (res.ok) {
      const d = await res.json()
      setMenuItems(d.items || [])
    }
  }

  const loadOrders = async (hid: string) => {
    const res = await fetch(`/api/orders?hotel_id=${hid}`)
    if (res.ok) {
      const d = await res.json()
      const fetchedOrders: Order[] = d.orders || []

      if (isFirstOrderFetch.current) {
        fetchedOrders.forEach(o => previousOrderIdsRef.current.add(o.id))
        isFirstOrderFetch.current = false
      } else {
        const newOrders = fetchedOrders.filter(o => !previousOrderIdsRef.current.has(o.id))
        if (newOrders.length > 0) {
          playNotificationSound()
          newOrders.forEach(o => {
            previousOrderIdsRef.current.add(o.id)
            const total = (o.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0)
            showToast('order', 'New Live Order', `Request received for Suite ${o.room_no}`, {
              roomNo: o.room_no,
              itemsCount: (o.items || []).reduce((sum, i) => sum + i.quantity, 0),
              totalPrice: total
            })
          })
        }
      }

      setOrders(fetchedOrders)
    }
  }

  // 5 seconds interval auto-refresh (Cronjob-style live tracking)
  useEffect(() => {
    if (!hotelId) return
    const interval = setInterval(() => {
      loadOrders(hotelId)
    }, 5000)
    return () => clearInterval(interval)
  }, [hotelId])

  useEffect(() => {
    const checkAuth = async () => {
      const resSession = await fetch('/api/auth/session')
      if (!resSession.ok) {
        router.push('/')
        return
      }

      const { session } = await resSession.json()
      if (!session || !session.hotel_id) {
        router.push('/')
        return
      }

      const uHotelId = session.hotel_id
      setHotelId(uHotelId)
      
      const res = await fetch(`/api/hotels?hotel_id=${uHotelId}`)
      if (res.ok) {
        const d = await res.json()
        setHotel(d.hotel)
      }

      await loadMenu(uHotelId)
      await loadOrders(uHotelId)

      const url = `${window.location.origin}/menu/${uHotelId}`
      setMenuUrl(url)
      QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err, url) => {
        if (!err) setQrCodeUrl(url)
      })

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleOpenAddModal = () => {
    setEditingItemId(null)
    setNewItem({ category: 'Main Course', name: '', price: '', description: '', image_url: '', available: true })
    setCustomCategory('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItemId(null)
    setNewItem({ category: 'Main Course', name: '', price: '', description: '', image_url: '', available: true })
    setCustomCategory('')
  }

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelId) return

    const finalCategory = newItem.category === 'custom' ? customCategory : newItem.category
    const isEdit = !!editingItemId
    const itemName = newItem.name

    handleCloseModal()

    if (isEdit) {
      showToast('info', 'Updating Catalog...', `Saving revisions for "${itemName}"`)
      try {
        const res = await fetch('/api/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItemId,
            name: newItem.name,
            price: parseFloat(newItem.price),
            category: finalCategory,
            description: newItem.description,
            image_url: newItem.image_url,
            available: newItem.available
          })
        })
        const data = await res.json()
        if (res.ok) {
          showToast('success', 'Item Updated', `"${itemName}" saved successfully!`)
          loadMenu(hotelId)
        } else {
          showToast('error', 'Update Failed', data.error || 'Could not update item')
        }
      } catch {
        showToast('error', 'Network Error', 'Connection failed')
      }
    } else {
      showToast('info', 'Registering Item...', `Adding "${itemName}" to menu`)
      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotelId,
            name: newItem.name,
            price: parseFloat(newItem.price),
            category: finalCategory,
            description: newItem.description,
            image_url: newItem.image_url
          })
        })
        const data = await res.json()
        if (res.ok) {
          showToast('success', 'Cuisine Added', `"${itemName}" registered in catalog!`)
          loadMenu(hotelId)
        } else {
          showToast('error', 'Registration Failed', data.error || 'Could not add item')
        }
      } catch {
        showToast('error', 'Network Error', 'Connection failed')
      }
    }
  }

  const handleEditClick = (item: MenuItem) => {
    setEditingItemId(item.id)
    const isStandard = ['Main Course', 'Appetizers', 'Desserts', 'Beverages', 'Soups & Salads', 'Breads & Sides'].includes(item.category)
    setNewItem({
      category: isStandard ? item.category : 'custom',
      name: item.name,
      price: String(item.price),
      description: item.description || '',
      image_url: item.image_url || '',
      available: item.available
    })
    setCustomCategory(isStandard ? '' : item.category)
    setIsModalOpen(true)
  }

  // Optimistic Availability Toggle (0ms UI feedback)
  const handleToggleAvailability = async (id: string, currentAvailable: boolean) => {
    const targetItem = menuItems.find(i => i.id === id)
    if (!targetItem) return
    const nextAvailable = !currentAvailable

    // 1. Optimistic Update (0ms)
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: nextAvailable } : i))
    showToast('success', 'Status Toggled', `"${targetItem.name}" set to ${nextAvailable ? 'Serving' : 'Suspended'}`)

    // 2. Background API Sync
    try {
      const res = await fetch(`/api/menu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: targetItem.name,
          price: targetItem.price,
          category: targetItem.category,
          description: targetItem.description,
          available: nextAvailable
        })
      })
      if (!res.ok) {
        const err = await res.json()
        setMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: currentAvailable } : i))
        showToast('error', 'Update Failed', err.error || 'Sync failed')
      }
    } catch {
      setMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: currentAvailable } : i))
      showToast('error', 'Network Error', 'Connection failed')
    }
  }

  // Optimistic Item Delete (0ms UI feedback)
  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    const itemToDelete = menuItems.find(i => i.id === id)
    
    // 1. Optimistic Removal (0ms)
    setMenuItems(prev => prev.filter(i => i.id !== id))
    showToast('info', 'Item Removed', `"${itemToDelete?.name || 'Cuisine item'}" deleted`)

    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        if (itemToDelete) setMenuItems(prev => [...prev, itemToDelete])
        showToast('error', 'Delete Failed', 'Item could not be deleted')
      }
    } catch {
      if (itemToDelete) setMenuItems(prev => [...prev, itemToDelete])
      showToast('error', 'Network Error', 'Could not delete item')
    }
  }

  // Optimistic Order Status Update (0ms UI feedback)
  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    const targetOrder = orders.find(o => o.id === id)
    if (!targetOrder) return
    const prevStatus = targetOrder.status

    // 1. Optimistic UI Update (0ms)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    showToast('success', 'Kitchen Command', `Suite ${targetOrder.room_no} set to ${newStatus}`)

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      if (!res.ok) {
        const err = await res.json()
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: prevStatus } : o))
        showToast('error', 'Status Update Error', err.error || 'Failed to update order status')
      }
    } catch {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: prevStatus } : o))
      showToast('error', 'Network Error', 'Connection failed')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins === 1) return '1 min ago'
      if (diffMins < 60) return `${diffMins} mins ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours === 1) return '1 hour ago'
      return `${diffHours} hours ago`
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-dots flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-gold-500/30" />
      </div>
    )
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div className={cn("min-h-screen bg-yellow-dots text-white font-sans flex flex-col pb-12", activeTab !== 'qr' && "pb-24")}>
      <header className="bg-obsidian-900/95 backdrop-blur-md border-b border-gold-500/30 sticky top-0 z-30 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold-gradient text-obsidian-950 flex items-center justify-center shadow-lg">
              <Store className="w-5 h-5 text-obsidian-950" />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-xl text-white tracking-tight">{hotel?.name || 'Dashboard'}</h1>
              <p className="text-[10px] font-black text-gold-300 uppercase tracking-widest">Premium Partner Suite</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-xs font-bold text-yellow-100/80 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
          >
            <span className="hidden sm:inline">Sign Out</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('menu')} 
            className={cn(
              "flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all duration-300 cursor-pointer",
              activeTab === 'menu' 
                ? "border-gold-300 text-gold-300 font-black" 
                : "border-transparent text-yellow-100/70 hover:text-white"
            )}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Menu Offerings
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={cn(
              "flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all duration-300 cursor-pointer relative",
              activeTab === 'orders' 
                ? "border-gold-300 text-gold-300 font-black" 
                : "border-transparent text-yellow-100/70 hover:text-white"
            )}
          >
            <ListOrdered className="w-4 h-4" />
            Live Guest Orders
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center bg-gold-gradient text-obsidian-950 font-black text-[10px] w-5 h-5 rounded-full shadow-sm animate-pulse ml-1">
                {pendingCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('qr')} 
            className={cn(
              "flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all duration-300 cursor-pointer",
              activeTab === 'qr' 
                ? "border-gold-300 text-gold-300 font-black" 
                : "border-transparent text-yellow-100/70 hover:text-white"
            )}
          >
            <QrCode className="w-4 h-4" />
            Marketing QR Code
          </button>
        </div>
      </header>

      <main className={cn("max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col mt-6", activeTab === 'qr' ? "py-4 flex-1" : "py-4")}>
        
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-obsidian-900/90 border border-gold-500/30 rounded-3xl shadow-xl overflow-hidden backdrop-blur-md">
              <div className="px-6 py-4.5 border-b border-gold-500/20 bg-obsidian-950/60 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h2 className="font-sans font-extrabold text-white tracking-tight text-base sm:text-lg">Current Cuisine Offerings</h2>
                  <p className="text-[10px] font-semibold text-yellow-100/80 mt-0.5">Manage details, pricing, descriptions, and catalog availability</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-gold-500/15 text-gold-300 text-[10px] font-bold px-3.5 py-1.5 rounded-full border border-gold-500/30">{menuItems.length} Plates</span>
                  <button
                    onClick={handleOpenAddModal}
                    className="btn-gold-foil text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-obsidian-950" />
                    Add Cuisine Item
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-obsidian-950 border-b border-gold-500/20 text-gold-300 uppercase text-[10px] font-extrabold tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Item & Ingredients</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Pricing</th>
                      <th className="px-6 py-4">Availability</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-200/10">
                    {menuItems.map(item => (
                      <tr key={item.id} className="hover:bg-gold-500/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          {item.description && (
                            <div className="text-gray-450 text-xs mt-0.5 max-w-[280px] sm:max-w-md break-words">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex bg-gold-500/10 border border-gold-500/25 text-gold-400 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider animate-pulse-slow">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          ₹{item.price}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleAvailability(item.id, item.available)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                              item.available 
                                ? "bg-green-950/30 text-green-400 border-green-900/40 hover:bg-green-900/40" 
                                : "bg-obsidian-950 text-gray-500 border-gold-500/10 hover:bg-obsidian-900"
                            )}
                          >
                            {item.available ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-gray-550" />}
                            {item.available ? 'Serving' : 'Suspended'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button 
                              onClick={() => handleEditClick(item)} 
                              className="p-2 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Edit Item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteMenu(item.id)} 
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {menuItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500 font-semibold bg-obsidian-900">
                          The menu catalog is currently vacant. Add your first gourmet option above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header Feed Controller */}
            <div className="bg-obsidian-900 border border-gold-500/25 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <Radio className="w-5 h-5 text-green-400 animate-pulse" />
                  <span className="absolute inset-0 rounded-full bg-green-400/40 animate-ping pointer-events-none" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                    Live Kitchen Dispatch Command
                  </h3>
                  <p className="text-xs text-champagne/80 font-medium">Auto-syncing live feed • {orders.length} Total Room Orders</p>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto p-1 bg-obsidian-950 rounded-2xl border border-gold-500/20">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer",
                    orderFilter === 'all'
                      ? "btn-gold-foil shadow-md"
                      : "text-champagne hover:text-white hover:bg-obsidian-900"
                  )}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('pending')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                    orderFilter === 'pending'
                      ? "bg-amber-500 text-obsidian-950 font-black shadow-md"
                      : "text-amber-400 hover:bg-obsidian-900"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Pending ({orders.filter(o => o.status === 'pending').length})
                </button>
                <button
                  onClick={() => setOrderFilter('preparing')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                    orderFilter === 'preparing'
                      ? "bg-blue-500 text-obsidian-950 font-black shadow-md"
                      : "text-blue-400 hover:bg-obsidian-900"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Preparing ({orders.filter(o => o.status === 'preparing').length})
                </button>
                <button
                  onClick={() => setOrderFilter('completed')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                    orderFilter === 'completed'
                      ? "bg-green-500 text-obsidian-950 font-black shadow-md"
                      : "text-green-400 hover:bg-obsidian-900"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Served ({orders.filter(o => o.status === 'completed').length})
                </button>
              </div>
            </div>

            {/* LUXURY ORDERS CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders
                .filter(order => orderFilter === 'all' || order.status === orderFilter)
                .map(order => {
                  const orderTotal = (order.items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
                  const totalPlates = (order.items || []).reduce((sum, i) => sum + i.quantity, 0)

                  return (
                    <div 
                      key={order.id} 
                      className="bg-obsidian-900/90 border border-gold-500/30 rounded-3xl p-5 shadow-xl hover:border-gold-300 hover:shadow-2xl transition-all duration-300 group cursor-pointer relative flex flex-col justify-between backdrop-blur-md"
                      onClick={() => setSelectedOrderModal(order)}
                    >
                      {/* Card Top: Suite Badge & Status */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="btn-gold-foil px-3 py-1 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-obsidian-950" />
                              Suite {order.room_no}
                            </span>
                            <span className="text-[10px] font-mono text-gold-300/70 font-bold">
                              #{order.id.slice(0, 6)}
                            </span>
                          </div>

                          <span className={cn(
                            "text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm",
                            order.status === 'pending' ? "bg-amber-950/70 text-amber-400 border-amber-500/40" :
                            order.status === 'preparing' ? "bg-blue-950/70 text-blue-400 border-blue-500/40" :
                            order.status === 'completed' ? "bg-green-950/70 text-green-400 border-green-500/40" :
                            "bg-obsidian-950 text-gray-400 border-gold-500/20"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full animate-pulse",
                              order.status === 'pending' ? "bg-amber-400" :
                              order.status === 'preparing' ? "bg-blue-400" :
                              order.status === 'completed' ? "bg-green-400" : "bg-gray-400"
                            )} />
                            {order.status === 'pending' ? 'Pending' : order.status === 'preparing' ? 'Preparing' : order.status === 'completed' ? 'Served' : order.status}
                          </span>
                        </div>

                        {/* Timestamp & Item Count */}
                        <div className="flex justify-between items-center text-xs text-champagne/80 font-medium mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gold-300" />
                            {getRelativeTime(order.created_at)}
                          </span>
                          <span className="font-bold text-white bg-obsidian-950 px-2.5 py-1 rounded-lg border border-gold-500/20">
                            {totalPlates} {totalPlates === 1 ? 'Plate' : 'Plates'} • ₹{orderTotal}
                          </span>
                        </div>

                        {/* Items Quick Snippet */}
                        <div className="space-y-1.5 bg-obsidian-950/90 border border-gold-500/20 rounded-2xl p-3 shadow-inner">
                          {(order.items || []).slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-white font-bold truncate max-w-[170px]">
                                <span className="text-gold-300 font-mono mr-1.5">{item.quantity}x</span>
                                {item.name}
                              </span>
                              <span className="text-gold-300 font-mono font-bold text-[11px]">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {(order.items || []).length > 2 && (
                            <p className="text-[10px] text-champagne/70 font-semibold pt-1 border-t border-gold-500/10">
                              +{(order.items || []).length - 2} more items in order...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* DESKTOP HOVER EXPANDED DETAILS POPOVER */}
                      <div className="hidden md:group-hover:flex flex-col absolute inset-0 bg-obsidian-950/98 backdrop-blur-md border-2 border-gold-400 rounded-3xl p-4 z-20 transition-all duration-300 shadow-2xl justify-between animate-fade-in-up">
                        <div>
                          <div className="flex justify-between items-center pb-2 border-b border-gold-500/20 mb-3">
                            <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                              <Store className="w-4 h-4 text-gold-300" />
                              Suite {order.room_no} Full Order
                            </span>
                            <span className="text-[10px] font-mono text-gold-300">#{order.id.slice(0, 6)}</span>
                          </div>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-white font-bold">
                                  <span className="text-gold-300 font-mono mr-1.5">{item.quantity}x</span>
                                  {item.name}
                                </span>
                                <span className="text-gold-300 font-mono font-bold">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gold-500/20 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-champagne uppercase font-bold block">Total Valuation</span>
                            <span className="text-gold-300 font-black text-sm">₹{orderTotal}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrderModal(order)
                            }}
                            className="btn-gold-foil px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-md"
                          >
                            <span>Open Controls</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* CARD FOOTER: INNOVATIVE KITCHEN COMMAND CONTROL */}
                      <div className="pt-4 mt-4 border-t border-gold-500/15 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="btn-gold-foil text-obsidian-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.02] cursor-pointer"
                            >
                              <Flame className="w-3.5 h-3.5 text-obsidian-950 fill-obsidian-950" />
                              <span>Start Cooking</span>
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="bg-green-600 hover:bg-green-500 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.02] cursor-pointer border border-green-400/50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Mark Served</span>
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <span className="bg-green-950/70 border border-green-500/40 text-green-400 text-[10px] font-extrabold px-3 py-1 rounded-xl flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                              Served & Done
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedOrderModal(order)}
                          className="p-2 bg-obsidian-950 hover:bg-obsidian-800 text-gold-300 border border-gold-500/30 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                          title="View Full Order"
                        >
                          <Eye className="w-3.5 h-3.5 text-gold-300" />
                          <span className="text-[11px] font-bold">Details</span>
                        </button>
                      </div>
                    </div>
                  )
                })}

              {orders.filter(order => orderFilter === 'all' || order.status === orderFilter).length === 0 && (
                <div className="col-span-full text-center py-20 bg-obsidian-900 border border-gold-500/20 rounded-3xl shadow-xl">
                  <div className="w-16 h-16 bg-obsidian-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-500/20">
                    <ListOrdered className="w-7 h-7 text-gold-300" />
                  </div>
                  <h3 className="text-base font-sans font-bold text-white mb-1">No Orders Match Filter</h3>
                  <p className="text-xs text-champagne/80 max-w-sm mx-auto leading-relaxed">
                    There are no live guest orders matching the "{orderFilter}" filter right now.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up w-full h-full pb-4">
            <div className="bg-obsidian-900 border border-gold-500/20 p-4 rounded-3xl shadow-2xl shadow-gold-500/10 mb-6 mt-auto max-w-[280px] w-full flex flex-col items-center">
              <div className="w-full text-center border-b border-gold-500/20 pb-3 mb-4">
                <p className="font-sans font-bold text-white text-sm tracking-tight">{hotel?.name}</p>
                <p className="text-[8px] uppercase tracking-widest text-gold-500 font-extrabold mt-0.5">Scan to Dine</p>
              </div>
              <div className="border border-gold-500/10 rounded-2xl p-4 bg-white shadow-inner">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-gold-500/5 animate-pulse rounded-xl" />
                )}
              </div>
              <div className="w-full text-center pt-3 mt-4 border-t border-gold-500/20">
                <p className="text-[8px] font-bold text-gold-500/50 tracking-wider">Powered by GuestQR</p>
              </div>
            </div>
            <h2 className="text-xl font-sans font-bold text-white mb-2 text-center tracking-tight">Your Menu QR Placement Code</h2>
           
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none justify-center px-4">
              <a 
                href={qrCodeUrl}
                download={`menu-qr-${hotel?.name?.replace(/\s+/g, '-').toLowerCase() || 'hotel'}.png`}
                className="bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-gold-500/15 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-gold-650 text-xs"
              >
                <Download className="w-4 h-4 text-obsidian-950" />
                Download High-Res
              </a>
              <Link 
                href={`/menu/${hotelId}`}
                target="_blank"
                className="bg-obsidian-950 border border-gold-500/25 hover:border-gold-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-xs"
              >
                <Eye className="w-4 h-4 text-gold-500" />
                Preview Catalog Menu
              </Link>
            </div>
            <div className="mt-8 mb-auto bg-obsidian-900 border border-gold-500/10 rounded-2xl p-2 pl-4 flex items-center gap-4 max-w-lg w-full shadow-sm mx-4">
              <code className="text-gray-400 text-xs font-bold flex-1 truncate">{menuUrl}</code>
              <button 
                onClick={handleCopyLink}
                className={cn(
                  "font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                  copied ? "bg-green-50 text-green-700 border border-green-200" : "bg-gold-500/10 text-gold-500 border border-gold-500/20 hover:bg-gold-500/20"
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Universal Floating Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[250] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "pointer-events-auto border rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in-up flex items-start justify-between gap-3 text-white transition-all",
              toast.type === 'error' ? "bg-red-950/90 border-red-500/40 text-red-100" :
              toast.type === 'success' ? "bg-obsidian-900/95 border-gold-500/40" :
              toast.type === 'order' ? "bg-obsidian-900/95 border-gold-500/50" :
              "bg-obsidian-900/95 border-gold-500/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                toast.type === 'error' ? "bg-red-900/30 border-red-500/40 text-red-400" :
                toast.type === 'success' ? "bg-green-950/30 border-green-500/40 text-green-400" :
                toast.type === 'order' ? "bg-gold-500/20 border-gold-500/30 text-gold-400" :
                "bg-gold-500/15 border-gold-500/25 text-gold-400"
              )}>
                {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                 toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                 toast.type === 'order' ? <BellRing className="w-5 h-5 animate-bounce" /> :
                 <Sparkles className="w-5 h-5 text-gold-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    toast.type === 'error' ? "text-red-400" : "text-gold-450"
                  )}>
                    {toast.title}
                  </span>
                  {toast.type === 'order' && <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />}
                </div>
                {toast.roomNo ? (
                  <>
                    <p className="font-sans font-bold text-sm text-white">Suite {toast.roomNo} <span className="font-normal text-gray-400">({toast.itemsCount} {toast.itemsCount === 1 ? 'plate' : 'plates'})</span></p>
                    <p className="font-mono font-bold text-xs text-gold-500 mt-0.5">Valuation: ₹{toast.totalPrice}</p>
                  </>
                ) : (
                  <p className="font-sans font-bold text-xs sm:text-sm text-white mt-0.5 leading-snug">{toast.message}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* MOBILE & DETAILED ORDER FEATURE MODAL SHEET */}
      {selectedOrderModal && (
        <div 
          className="fixed inset-0 z-[220] flex justify-center items-end sm:items-center p-0 sm:p-4 bg-obsidian-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div 
            className="bg-obsidian-900 border-t sm:border border-gold-500/35 rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gold-500/25 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="btn-gold-foil px-3.5 py-1 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-obsidian-950" />
                    Suite {selectedOrderModal.room_no}
                  </span>
                  <span className="text-xs font-mono text-gold-300 font-bold">
                    #{selectedOrderModal.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-xs text-champagne/80 mt-2 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold-300" />
                  Received {getRelativeTime(selectedOrderModal.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 bg-obsidian-950 hover:bg-obsidian-850 text-gold-300 border border-gold-500/30 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Items Table */}
            <div className="space-y-3 mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold-300 block">
                Dishes Requested
              </span>
              <div className="bg-obsidian-950/90 border border-gold-500/20 rounded-2xl p-4 divide-y divide-gold-500/10 space-y-3">
                {(selectedOrderModal.items || []).map((item, idx) => (
                  <div key={idx} className={cn("flex justify-between items-center text-sm pt-2", idx === 0 && "pt-0")}>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-gold-500/20 border border-gold-500/30 rounded-xl text-gold-300 text-xs font-mono font-black flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-extrabold text-white text-sm">{item.name}</p>
                        <p className="text-xs text-champagne/70 font-semibold">₹{item.price} each</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-gold-300 text-sm">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}

                <div className="pt-3 flex justify-between items-center border-t border-gold-500/20 text-sm">
                  <span className="font-extrabold text-white">Grand Valuation Total</span>
                  <span className="font-black text-gold-300 text-base">
                    ₹{(selectedOrderModal.items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* INNOVATIVE KITCHEN STATUS STEPPER & CONTROL */}
            <div className="space-y-3 pt-4 border-t border-gold-500/25">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold-300 block">
                Kitchen Command Dispatch Control
              </span>

              {/* Status Stepper Pills */}
              <div className="grid grid-cols-3 gap-2 bg-obsidian-950 p-1.5 rounded-2xl border border-gold-500/30 text-center">
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrderModal.id, 'pending')
                    setSelectedOrderModal(prev => prev ? { ...prev, status: 'pending' } : null)
                  }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                    selectedOrderModal.status === 'pending' ? "bg-amber-500 text-obsidian-950 shadow-md" : "text-amber-400 hover:bg-obsidian-900"
                  )}
                >
                  Pending
                </button>

                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrderModal.id, 'preparing')
                    setSelectedOrderModal(prev => prev ? { ...prev, status: 'preparing' } : null)
                  }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                    selectedOrderModal.status === 'preparing' ? "bg-blue-500 text-obsidian-950 shadow-md" : "text-blue-400 hover:bg-obsidian-900"
                  )}
                >
                  Cooking
                </button>

                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrderModal.id, 'completed')
                    setSelectedOrderModal(prev => prev ? { ...prev, status: 'completed' } : null)
                  }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                    selectedOrderModal.status === 'completed' ? "bg-green-500 text-obsidian-950 shadow-md" : "text-green-400 hover:bg-obsidian-900"
                  )}
                >
                  Served
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                {selectedOrderModal.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrderModal.id, 'preparing')
                      setSelectedOrderModal(null)
                    }}
                    className="w-full btn-gold-foil py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-obsidian-950 fill-obsidian-950" />
                    <span>Acknowledge & Start Cooking</span>
                  </button>
                )}

                {selectedOrderModal.status === 'preparing' && (
                  <button
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrderModal.id, 'completed')
                      setSelectedOrderModal(null)
                    }}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl cursor-pointer border border-green-400/40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Mark Dispatched & Served</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrderModal(null)}
                  className="w-full bg-obsidian-950 hover:bg-obsidian-800 text-gold-300 border border-gold-500/30 py-3 rounded-2xl text-xs font-extrabold cursor-pointer"
                >
                  Close Detail Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start sm:items-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in animate-none">
          <div className="bg-obsidian-900 border border-gold-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative my-auto animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button
              onClick={handleCloseModal}
              className="absolute right-5 top-5 p-1.5 bg-obsidian-950 hover:bg-obsidian-800 border border-gold-500/10 text-gray-400 hover:text-gold-500 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-sans font-bold text-white mb-6 flex items-center gap-2">
              {editingItemId ? <Pencil className="w-5 h-5 text-gold-500" /> : <Plus className="w-5 h-5 text-gold-500" />}
              {editingItemId ? 'Refine Cuisine Item' : 'Introduce New Cuisine Item'}
            </h2>
            <form onSubmit={handleAddMenu} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Category</label>
                <div className="relative">
                  <select
                    required
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Soups & Salads">Soups & Salads</option>
                    <option value="Breads & Sides">Breads & Sides</option>
                    <option value="custom">Other / Custom...</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 pointer-events-none" />
                </div>
              </div>
              {newItem.category === 'custom' && (
                <div className="animate-fade-in-up">
                  <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Custom Category Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Seafood Specials" 
                    value={customCategory} 
                    onChange={e => setCustomCategory(e.target.value)} 
                    className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-gray-550 focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 focus:bg-obsidian-950 outline-none transition-all" 
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Dish Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Signature Truffle Risotto" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 focus:bg-obsidian-950 outline-none transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="1" 
                    min="0" 
                    placeholder="450" 
                    value={newItem.price} 
                    onChange={e => setNewItem({...newItem, price: e.target.value})} 
                    className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 focus:bg-obsidian-950 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Availability</label>
                  <div className="relative">
                    <select
                      value={newItem.available ? "true" : "false"}
                      onChange={e => setNewItem({...newItem, available: e.target.value === "true"})}
                      className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="true">Serving / Available</option>
                      <option value="false">Suspended / Unavailable</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Gourmet Description (Optional)</label>
                <textarea 
                  placeholder="A descriptive gourmet summary highlighting key ingredients..." 
                  value={newItem.description} 
                  onChange={e => setNewItem({...newItem, description: e.target.value})} 
                  rows={3}
                  className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 focus:bg-obsidian-950 outline-none transition-all resize-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gold-500/80 mb-1.5 uppercase tracking-wider">Dish Image URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/... or image link" 
                  value={newItem.image_url} 
                  onChange={e => setNewItem({...newItem, image_url: e.target.value})} 
                  className="w-full bg-obsidian-950 border border-gold-500/20 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-gray-550 focus:ring-2 focus:ring-gold-500/10 focus:border-gold-500 focus:bg-obsidian-950 outline-none transition-all" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="w-1/2 bg-obsidian-950 hover:bg-obsidian-850 text-gray-400 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md cursor-pointer border border-gold-500/10 flex items-center justify-center gap-1.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-gold-500/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-gold-650 flex items-center justify-center gap-1.5"
                >
                  {editingItemId ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
                  {editingItemId ? 'Update Item' : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
