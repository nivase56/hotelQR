import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_hotel_id')
  return Response.json({ success: true })
}
