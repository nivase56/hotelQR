import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_hotel_id')
  return Response.json({ success: true })
}
