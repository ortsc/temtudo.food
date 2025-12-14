import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface ProductInput {
  id_produto: number
  nome_produto: string
  quantidade: number
}

interface PriceRecord {
  id_preco: number
  id_produto: number
  id_mercado: number
  preco: number
}

interface MarketRecord {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  bairro_mercado: string | null
  cidade_mercado: string | null
  latitude: number | null
  longitude: number | null
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { products, userLat, userLng } = body as {
      products: ProductInput[]
      userLat?: number
      userLng?: number
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products provided' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all prices for the requested products
    const productIds = products.map(p => p.id_produto)
    
    // Fetch prices in batches if needed
    const allPrices: PriceRecord[] = []
    const batchSize = 500
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batchIds = productIds.slice(i, i + batchSize)
      const { data: prices, error } = await supabase
        .from('Precos')
        .select('id_preco, id_produto, id_mercado, preco')
        .in('id_produto', batchIds)
        .order('preco', { ascending: true })
      
      if (error) {
        console.error('Error fetching prices:', error)
        continue
      }
      
      allPrices.push(...(prices as PriceRecord[]))
    }

    if (allPrices.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          bestMarket: null,
          potentialMarkets: [],
          allProducts: products.map(p => ({
            id_produto: p.id_produto,
            nome_produto: p.nome_produto,
            bestMarket: null,
            savings: 0,
          })),
          totalSavings: 0,
        },
      })
    }

    // Get unique market IDs
    const marketIds = [...new Set(allPrices.map(p => p.id_mercado))]

    // Fetch market details
    const { data: markets } = await supabase
      .from('Mercados')
      .select('id_mercado, nome_mercado, endereco_mercado, bairro_mercado, cidade_mercado, latitude, longitude')
      .in('id_mercado', marketIds)

    const marketMap = new Map<number, MarketRecord>(
      (markets || []).map(m => [m.id_mercado, m as MarketRecord])
    )

    // Group prices by market
    const pricesByMarket: Map<number, Map<number, number>> = new Map()
    
    allPrices.forEach(price => {
      if (!pricesByMarket.has(price.id_mercado)) {
        pricesByMarket.set(price.id_mercado, new Map())
      }
      const marketPrices = pricesByMarket.get(price.id_mercado)!
      // Keep lowest price for each product
      if (!marketPrices.has(price.id_produto) || marketPrices.get(price.id_produto)! > Number(price.preco)) {
        marketPrices.set(price.id_produto, Number(price.preco))
      }
    })

    // Find best price for each product across all markets
    const productBestPrices: Map<number, { marketId: number; price: number }> = new Map()
    
    products.forEach(product => {
      let bestPrice = Infinity
      let bestMarketId = -1
      
      pricesByMarket.forEach((prices, marketId) => {
        const price = prices.get(product.id_produto)
        if (price !== undefined && price < bestPrice) {
          bestPrice = price
          bestMarketId = marketId
        }
      })
      
      if (bestMarketId !== -1) {
        productBestPrices.set(product.id_produto, { marketId: bestMarketId, price: bestPrice })
      }
    })

    // Score each market
    interface MarketScore {
      marketId: number
      totalPrice: number
      availableCount: number
      missingProducts: string[]
      score: number
      distance?: number
    }

    const marketScores: MarketScore[] = []

    pricesByMarket.forEach((prices, marketId) => {
      const market = marketMap.get(marketId)
      if (!market) return

      let totalPrice = 0
      let availableCount = 0
      const missingProducts: string[] = []

      products.forEach(product => {
        const price = prices.get(product.id_produto)
        if (price !== undefined) {
          totalPrice += price * product.quantidade
          availableCount++
        } else {
          missingProducts.push(product.nome_produto)
        }
      })

      // Calculate distance if user location is provided
      let distance: number | undefined
      if (userLat && userLng && market.latitude && market.longitude) {
        distance = calculateDistance(userLat, userLng, Number(market.latitude), Number(market.longitude))
      }

      const availabilityScore = availableCount / products.length
      const avgPrice = availableCount > 0 ? totalPrice / availableCount : Infinity
      const score = availabilityScore * 0.7

      marketScores.push({
        marketId,
        totalPrice,
        availableCount,
        missingProducts,
        score,
        distance,
      })
    })

    // Normalize price scores
    const validMarkets = marketScores.filter(m => m.availableCount > 0)
    if (validMarkets.length > 0) {
      const minPrice = Math.min(...validMarkets.map(m => m.totalPrice / m.availableCount))
      const maxPrice = Math.max(...validMarkets.map(m => m.totalPrice / m.availableCount))
      const priceRange = maxPrice - minPrice || 1

      validMarkets.forEach(m => {
        const avgPrice = m.totalPrice / m.availableCount
        const priceScore = 1 - ((avgPrice - minPrice) / priceRange)
        m.score += priceScore * 0.3
      })
    }

    // Sort by score descending
    marketScores.sort((a, b) => b.score - a.score)

    // Get top markets (limit to 20)
    const topMarkets = marketScores.slice(0, 20).map(score => {
      const market = marketMap.get(score.marketId)!
      return {
        id_mercado: market.id_mercado,
        nome_mercado: market.nome_mercado,
        endereco_mercado: market.endereco_mercado,
        bairro_mercado: market.bairro_mercado,
        totalPrice: score.totalPrice,
        availableCount: score.availableCount,
        missingProducts: score.missingProducts,
        distance: score.distance,
        score: score.score
      }
    })

    const bestMarketScore = marketScores[0]
    const bestMarket = bestMarketScore ? marketMap.get(bestMarketScore.marketId) : null

    // Prepare per-product results
    const allProductResults = products.map(product => {
      const best = productBestPrices.get(product.id_produto)
      let maxPrice = 0
      pricesByMarket.forEach(prices => {
        const price = prices.get(product.id_produto)
        if (price !== undefined && price > maxPrice) {
          maxPrice = price
        }
      })

      return {
        id_produto: product.id_produto,
        nome_produto: product.nome_produto,
        quantidade: product.quantidade,
        bestMarket: best ? {
          id_mercado: best.marketId,
          nome_mercado: marketMap.get(best.marketId)?.nome_mercado || 'Unknown',
          preco: best.price,
          total: best.price * product.quantidade
        } : null,
        savings: best ? (maxPrice - best.price) * product.quantidade : 0,
      }
    })

    const totalSavings = allProductResults.reduce((sum, p) => sum + p.savings, 0)

    return NextResponse.json({
      success: true,
      result: {
        // Keep bestMarket for backward compatibility if needed, but potentialMarkets is the new main list
        bestMarket: bestMarket && bestMarketScore ? {
          id_mercado: bestMarket.id_mercado,
          nome_mercado: bestMarket.nome_mercado,
          endereco_mercado: bestMarket.endereco_mercado,
          bairro_mercado: bestMarket.bairro_mercado,
          totalPrice: bestMarketScore.totalPrice,
          availableCount: bestMarketScore.availableCount,
          missingProducts: bestMarketScore.missingProducts,
          distance: bestMarketScore.distance,
        } : null,
        potentialMarkets: topMarkets,
        allProducts: allProductResults,
        totalSavings,
      },
    })
  } catch (error) {
    console.error('Error in cart-optimize:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
