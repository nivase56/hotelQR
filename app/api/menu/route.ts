// app/api/menu/route.ts
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: Guest or Admin menu fetch
// /api/menu?hotel_id=xxx&admin=true
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const hotel_id = searchParams.get('hotel_id')
  const admin = searchParams.get('admin') === 'true'

  let query = supabase
    .from('menu_items')
    .select('*')
    .eq('hotel_id', hotel_id)

  if (!admin) {
    query = query.eq('available', true)
  }

  const { data, error } = await query.order('category')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ items: data })
}

// POST: Admin menu add
export async function POST(req: Request) {
  const { hotel_id, name, price, category, description, image_url } = await req.json()

  const { data, error } = await supabase
    .from('menu_items')
    .insert({ hotel_id, name, price, category, description, image_url, available: true })
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return Response.json({ error: 'Failed to insert item' }, { status: 500 })

  return Response.json({ item: data[0] })
}

// PUT: Admin menu edit
export async function PUT(req: Request) {
  const { id, name, price, category, description, image_url, available } = await req.json()

  const { data, error } = await supabase
    .from('menu_items')
    .update({ name, price, category, description, image_url, available })
    .eq('id', id)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return Response.json({ error: 'Item not found or no changes made' }, { status: 404 })

  return Response.json({ item: data[0] })
}

// DELETE: Admin menu delete
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}