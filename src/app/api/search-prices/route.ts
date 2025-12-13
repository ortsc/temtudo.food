import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MarketPrice {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  preco: number
  data_hora: string
  // Placeholder coordinates (in production, these would be stored in the DB)
  lat: number
  lng: number
  distance?: number
}

// Simulated coordinates for markets (in production, store real coords in DB)
const marketCoordinates: Record<number, { lat: number; lng: number }> = {
  1: { lat: -23.5629, lng: -46.6544 }, // Extra - Paulista
  2: { lat: -23.5547, lng: -46.6625 }, // Carrefour - Augusta
  3: { lat: -22.9068, lng: -43.1729 }, // Pão de Açúcar - RJ
  4: { lat: -22.9052, lng: -47.0608 }, // Atacadão - Campinas
  5: { lat: -23.5418, lng: -46.6296 }, // Mercado Municipal
  6: { lat: -23.5505, lng: -46.6333 }, // Assaí
  7: { lat: -8.0476, lng: -34.8770 },  // Big Bompreço - Recife
  8: { lat: -30.0346, lng: -51.2177 }, // Zaffari - POA
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, userLat, userLng } = body

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nome do produto não fornecido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Search for products matching the query
    const { data: products, error: productError } = await supabase
      .from('Produtos')
      .select('id_produto, nome_produto, marca_produto, categoria')
      .or(`nome_produto.ilike.%${productName}%,marca_produto.ilike.%${productName}%`)

    if (productError) {
      console.error('Error searching products:', productError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        product: null,
        markets: [],
        message: 'Nenhum produto encontrado'
      })
    }

    // Get product IDs
    const productIds = products.map((p: { id_produto: number }) => p.id_produto)

    // Get latest prices for these products at each market
    const { data: prices, error: pricesError } = await supabase
      .from('Precos')
      .select(`
        id_preco,
        id_produto,
        id_mercado,
        preco,
        data_hora,
        Mercados!inner (
          id_mercado,
          nome_mercado,
          endereco_mercado,
          cidade_mercado,
          estado_mercado
        )
      `)
      .in('id_produto', productIds)
      .order('data_hora', { ascending: false })

    if (pricesError) {
      console.error('Error fetching prices:', pricesError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar preços' },
        { status: 500 }
      )
    }

    // Group by market and get the best (lowest) price at each
    const marketPricesMap = new Map<number, MarketPrice>()

    for (const price of prices || []) {
      const mercado = price.Mercados as unknown as {
        id_mercado: number
        nome_mercado: string
        endereco_mercado: string | null
        cidade_mercado: string | null
        estado_mercado: string | null
      }
      
      const marketId = mercado.id_mercado
      const existingPrice = marketPricesMap.get(marketId)

      // Keep the lowest price for this market
      if (!existingPrice || (price.preco && price.preco < existingPrice.preco)) {
        const coords = marketCoordinates[marketId] || { lat: -23.55, lng: -46.63 }
        
        marketPricesMap.set(marketId, {
          id_mercado: marketId,
          nome_mercado: mercado.nome_mercado || 'Mercado',
          endereco_mercado: mercado.endereco_mercado,
          cidade_mercado: mercado.cidade_mercado,
          estado_mercado: mercado.estado_mercado,
          preco: price.preco || 0,
          data_hora: price.data_hora || '',
          lat: coords.lat,
          lng: coords.lng,
        })
      }
    }

    // Convert to array and calculate distances
    let marketPrices = Array.from(marketPricesMap.values())

    // Calculate distance if user location is provided
    if (userLat && userLng) {
      marketPrices = marketPrices.map(market => ({
        ...market,
        distance: calculateDistance(userLat, userLng, market.lat, market.lng)
      }))
    }

    // Sort by price (lowest first)
    marketPrices.sort((a, b) => a.preco - b.preco)

    // Add price tier for coloring
    const marketsWithTier = marketPrices.map((market, index) => ({
      ...market,
      tier: index === 0 ? 'best' : index < marketPrices.length / 2 ? 'medium' : 'high'
    }))

    return NextResponse.json({
      success: true,
      product: products[0],
      markets: marketsWithTier,
    })
  } catch (error) {
    console.error('Error in search-prices:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET endpoint to list all products for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const supabase = await createClient()

    let productsQuery = supabase
      .from('Produtos')
      .select('id_produto, nome_produto, marca_produto, categoria')
      .limit(10)

    if (query) {
      productsQuery = productsQuery.or(
        `nome_produto.ilike.%${query}%,marca_produto.ilike.%${query}%`
      )
    }

    const { data: products, error } = await productsQuery

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      products: products || []
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

