/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, no-console */
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(url, key)

async function check() {
  const { data: insertData, error: insertErr } = await supabase
    .from('orders')
    .insert({ hotel_id: '30500cae-7192-4e07-84ff-ef88439bdcdc', room_no: '999', items: [], status: 'pending' })
    .select()
  console.log('Insert test on orders:', { insertData, insertErr })
  
  if (insertData && insertData.length > 0) {
    const tempId = insertData[0].id
    const { data: updateData, error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', tempId)
      .select()
    console.log('Update test on newly created order:', { updateData, updateErr })

    const { error: deleteErr } = await supabase
      .from('orders')
      .delete()
      .eq('id', tempId)
    console.log('Delete test on orders:', { deleteErr })
  }
}

check()
