import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const hotel_id = cookieStore.get('auth_hotel_id')?.value

  if (!hotel_id) {
    return Response.json({ session: null }, { status: 401 })
  }

  return Response.json({ session: { hotel_id } })
}
