import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MarketPrice {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  bairro_mercado: string | null
  preco: number
  data_hora: string
  lat: number
  lng: number
  distance?: number
}

interface PriceRow {
  id_preco: number
  id_produto: number | null
  id_mercado: number | null
  preco: number
  data_hora: string
}

interface MercadoRow {
  id_mercado: number
  nome_mercado: string | null
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  bairro_mercado: string | null
  latitude: number | null
  longitude: number | null
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
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url') {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado', markets: [] },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { productId, productName, userLat, userLng } = body

    if (!productId && !productName) {
      return NextResponse.json(
        { success: false, error: 'ID ou nome do produto não fornecido', markets: [] },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    let products: Array<{ id_produto: number; nome_produto: string | null; marca_produto: string | null; categoria: string | null }> = []
    
    // If productId is provided, use it directly
    if (productId) {
      const { data: productData, error: productError } = await supabase
        .from('Produtos')
        .select('id_produto, nome_produto, marca_produto, categoria')
        .eq('id_produto', productId)
      
      if (productError) {
        console.error('Error fetching product by ID:', productError)
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar produto', markets: [] },
          { status: 500 }
        )
      }
      
      products = productData || []
    } else if (productName) {
      // Fallback to name search
      const { data: productData, error: productError } = await supabase
        .from('Produtos')
        .select('id_produto, nome_produto, marca_produto, categoria')
        .or(`nome_produto.ilike.%${productName}%,marca_produto.ilike.%${productName}%`)

      if (productError) {
        console.error('Error searching products:', productError)
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar produtos', markets: [] },
          { status: 500 }
        )
      }
      
      products = productData || []
    }

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        product: null,
        markets: [],
        message: 'Nenhum produto encontrado'
      })
    }

    // Get product IDs
    const productIds = products.map((p) => p.id_produto)

    // Get all prices for these products (paginated to avoid 1000 row limit)
    let allPrices: PriceRow[] = []
    let page = 0
    const pageSize = 1000

    while (true) {
      const { data: priceBatch, error: pricesError } = await supabase
        .from('Precos')
        .select('id_preco, id_produto, id_mercado, preco, data_hora')
        .in('id_produto', productIds)
        .order('data_hora', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (pricesError) {
        console.error('Error fetching prices:', pricesError)
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar preços', markets: [] },
          { status: 500 }
        )
      }

      if (!priceBatch || priceBatch.length === 0) break
      
      allPrices = allPrices.concat(priceBatch as PriceRow[])
      
      if (priceBatch.length < pageSize) break
      page++
    }

    const priceRows = allPrices.length > 0 ? allPrices : null

    if (!priceRows || priceRows.length === 0) {
      return NextResponse.json({
        success: true,
        product: products[0],
        markets: [],
        message: 'Nenhum preço encontrado para este produto'
      })
    }

    // Get unique market IDs
    const marketIds = [...new Set(
      priceRows
        .map(p => p.id_mercado)
        .filter((id): id is number => id !== null)
    )]

    if (marketIds.length === 0) {
      return NextResponse.json({
        success: true,
        product: products[0],
        markets: [],
        message: 'Nenhum mercado encontrado'
      })
    }

    // Fetch market details
    const { data: mercados, error: mercadosError } = await supabase
      .from('Mercados')
      .select('id_mercado, nome_mercado, endereco_mercado, cidade_mercado, estado_mercado, bairro_mercado, latitude, longitude')
      .in('id_mercado', marketIds)

    if (mercadosError) {
      console.error('Error fetching mercados:', mercadosError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar mercados', markets: [] },
        { status: 500 }
      )
    }

    const mercadoRows = mercados as MercadoRow[] | null

    // Create market lookup
    const mercadoLookup = new Map<number, MercadoRow>(
      (mercadoRows || []).map(m => [m.id_mercado, m])
    )

    // Group by market and get the best (lowest) price at each
    const marketPricesMap = new Map<number, MarketPrice>()

    for (const price of priceRows) {
      if (!price.id_mercado) continue
      
      const mercado = mercadoLookup.get(price.id_mercado)
      if (!mercado) continue

      const existingPrice = marketPricesMap.get(price.id_mercado)

      // Keep the lowest price for this market
      if (!existingPrice || (price.preco && price.preco < existingPrice.preco)) {
        // Use real coordinates from DB, fallback to Rio center
        const lat = mercado.latitude ? Number(mercado.latitude) : -22.9838
        const lng = mercado.longitude ? Number(mercado.longitude) : -43.2244
        
        marketPricesMap.set(price.id_mercado, {
          id_mercado: price.id_mercado,
          nome_mercado: mercado.nome_mercado || 'Mercado',
          endereco_mercado: mercado.endereco_mercado,
          cidade_mercado: mercado.cidade_mercado,
          estado_mercado: mercado.estado_mercado,
          bairro_mercado: mercado.bairro_mercado,
          preco: price.preco || 0,
          data_hora: price.data_hora || '',
          lat,
          lng,
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
      { success: false, error: 'Erro interno do servidor', markets: [] },
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
