import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'marketId required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch market to get its location
    const { data: market } = await supabase
      .from('Mercados')
      .select('latitude, longitude, bairro_mercado, cidade_mercado')
      .eq('id_mercado', marketId)
      .single()

    if (!market) {
      return NextResponse.json(
        { success: false, error: 'Market not found' },
        { status: 404 }
      )
    }

    // Fetch recent searches (for now, return all - in production, filter by region)
    const { data: searches, error } = await supabase
      .from('Pesquisas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching searches:', error)
      return NextResponse.json(
        { success: false, error: 'Error fetching searches' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      searches: searches || [],
      market: {
        bairro: market.bairro_mercado,
        cidade: market.cidade_mercado,
      },
    })
  } catch (error) {
    console.error('Error in admin searches:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

