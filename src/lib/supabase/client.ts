'use client'

import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use placeholder values if env vars are not set (build time)
  const url = supabaseUrl && supabaseUrl !== 'your_supabase_url' 
    ? supabaseUrl 
    : 'https://placeholder.supabase.co'
  const key = supabaseAnonKey && supabaseAnonKey !== 'your_anon_key'
    ? supabaseAnonKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

  if (url === 'https://placeholder.supabase.co') {
    console.warn('Supabase environment variables not configured. Please update .env.local')
  }

  client = createBrowserClient(url, key)
  return client
}
