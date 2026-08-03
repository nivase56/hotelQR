// app/api/orders/route.ts
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { hotel_id, room_no, items } = await req.json()

  const { data, error } = await supabase
    .from('orders')
    .insert({ hotel_id, room_no, items, status: 'pending' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ order_id: data.id })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const hotel_id = url.searchParams.get('hotel_id')
  const idsParam = url.searchParams.get('ids')

  let query = supabase.from('orders').select('*')

  if (idsParam) {
    const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return Response.json({ orders: [] })
    }
  } else if (hotel_id) {
    query = query.eq('hotel_id', hotel_id)
  } else {
    return Response.json({ error: 'hotel_id or ids parameter is required' }, { status: 400 })
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ orders: data })
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json()

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ order: data })
}