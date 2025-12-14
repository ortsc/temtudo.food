import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MarketWithAvgPrice {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  bairro_mercado: string | null
  telefone_mercado: string | null
  website_mercado: string | null
  lat: number
  lng: number
  avgPrice: number | null
  productCount: number
  tier: 'cheap' | 'medium' | 'expensive' | 'no-data'
}

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url') {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado', markets: [] },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Get all markets with coordinates
    const { data: markets, error: marketsError } = await supabase
      .from('Mercados')
      .select('id_mercado, nome_mercado, endereco_mercado, cidade_mercado, estado_mercado, bairro_mercado, latitude, longitude, telefone_mercado, website_mercado')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (marketsError) {
      console.error('Error fetching markets:', marketsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar mercados', markets: [] },
        { status: 500 }
      )
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json({
        success: true,
        markets: [],
      })
    }

    // Get all prices grouped by market with average
    // Fetch in batches to avoid Supabase 1000 row limit
    let allPriceData: Array<{ id_mercado: number; preco: number }> = []
    let page = 0
    const pageSize = 1000

    while (true) {
      const { data: priceBatch, error: pricesError } = await supabase
        .from('Precos')
        .select('id_mercado, preco')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (pricesError) {
        console.error('Error fetching prices:', pricesError)
        break
      }

      if (!priceBatch || priceBatch.length === 0) break
      
      allPriceData = allPriceData.concat(priceBatch as Array<{ id_mercado: number; preco: number }>)
      
      if (priceBatch.length < pageSize) break // Last page
      page++
    }

    // Calculate average price per market
    const marketPriceMap = new Map<number, { total: number; count: number }>()
    
    for (const price of allPriceData) {
      if (price.id_mercado && price.preco) {
        const existing = marketPriceMap.get(price.id_mercado) || { total: 0, count: 0 }
        existing.total += Number(price.preco)
        existing.count += 1
        marketPriceMap.set(price.id_mercado, existing)
      }
    }

    // Calculate global average for tier comparison
    let globalTotal = 0
    let globalCount = 0
    marketPriceMap.forEach(({ total, count }) => {
      globalTotal += total
      globalCount += count
    })
    const globalAvg = globalCount > 0 ? globalTotal / globalCount : 0

    // Define market type from query
    interface MarketRow {
      id_mercado: number
      nome_mercado: string | null
      endereco_mercado: string | null
      cidade_mercado: string | null
      estado_mercado: string | null
      bairro_mercado: string | null
      telefone_mercado: string | null
      website_mercado: string | null
      latitude: number | null
      longitude: number | null
    }

    // Build response with tier classification
    const marketsWithPrices: MarketWithAvgPrice[] = (markets as MarketRow[]).map(market => {
      const priceInfo = marketPriceMap.get(market.id_mercado)
      const avgPrice = priceInfo ? priceInfo.total / priceInfo.count : null
      const productCount = priceInfo?.count || 0

      // Determine tier based on comparison to global average
      let tier: 'cheap' | 'medium' | 'expensive' | 'no-data' = 'no-data'
      if (avgPrice !== null && globalAvg > 0) {
        const ratio = avgPrice / globalAvg
        if (ratio <= 0.9) {
          tier = 'cheap'
        } else if (ratio <= 1.1) {
          tier = 'medium'
        } else {
          tier = 'expensive'
        }
      }

      return {
        id_mercado: market.id_mercado,
        nome_mercado: market.nome_mercado || 'Mercado',
        endereco_mercado: market.endereco_mercado,
        cidade_mercado: market.cidade_mercado,
        estado_mercado: market.estado_mercado,
        bairro_mercado: market.bairro_mercado,
        telefone_mercado: market.telefone_mercado,
        website_mercado: market.website_mercado,
        lat: Number(market.latitude),
        lng: Number(market.longitude),
        avgPrice,
        productCount,
        tier,
      }
    })

    return NextResponse.json({
      success: true,
      markets: marketsWithPrices,
      globalAvgPrice: globalAvg,
    })
  } catch (error) {
    console.error('Error in markets API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', markets: [] },
      { status: 500 }
    )
  }
}

