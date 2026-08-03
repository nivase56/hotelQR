import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return Response.json({ error: 'Username and password are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hotels')
    .select('id, password')
    .eq('username', username)
    .single()

  if (error || !data) {
    return Response.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  if (data.password !== password) {
    return Response.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // Set auth cookie
  const cookieStore = await cookies()
  cookieStore.set('auth_hotel_id', data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  return Response.json({ success: true, hotel_id: data.id })
}
