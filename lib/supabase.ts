// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://usgbfvwbnsjyddwogpua.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZ2JmdndibnNqeWRkd29ncHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzA3MDEsImV4cCI6MjEwMTI0NjcwMX0.tLMIoZV53ivcLRgNanAv9qQHsp9yec87Y1ik6W9X73M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)