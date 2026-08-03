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

  let insertPayload: Record<string, unknown> = { hotel_id, name, price, category, description, available: true }
  if (image_url) {
    insertPayload.image_url = image_url
  }

  let { data, error } = await supabase
    .from('menu_items')
    .insert(insertPayload)
    .select()

  // If image_url column doesn't exist in Supabase schema, fallback without image_url
  if (error && (error.message?.includes('image_url') || error.code === 'PGRST204')) {
    delete insertPayload.image_url
    const retry = await supabase
      .from('menu_items')
      .insert(insertPayload)
      .select()
    data = retry.data
    error = retry.error
  }

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return Response.json({ error: 'Failed to insert item' }, { status: 500 })

  return Response.json({ item: data[0] })
}

// PUT: Admin menu edit
export async function PUT(req: Request) {
  const { id, name, price, category, description, image_url, available } = await req.json()

  let updatePayload: Record<string, unknown> = { name, price, category, description, available }
  if (image_url !== undefined) {
    updatePayload.image_url = image_url
  }

  let { data, error } = await supabase
    .from('menu_items')
    .update(updatePayload)
    .eq('id', id)
    .select()

  // If image_url column doesn't exist in Supabase schema, fallback without image_url
  if (error && (error.message?.includes('image_url') || error.code === 'PGRST204')) {
    delete updatePayload.image_url
    const retry = await supabase
      .from('menu_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
    data = retry.data
    error = retry.error
  }

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