// app/api/hotels/route.ts
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { name, phone, address, username, password } = await req.json()

  const { data, error } = await supabase
    .from('hotels')
    .insert({ name, phone, address, username, password })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ hotel_id: data.id, hotel: data })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const hotel_id = searchParams.get('hotel_id')

  if (!hotel_id) {
    return Response.json({ error: 'hotel_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotel_id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ hotel: data })
}