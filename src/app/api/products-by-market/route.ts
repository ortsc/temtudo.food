import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PriceRow {
  id_preco: number
  preco: number
  data_hora: string
  id_produto: number | null
}

interface ProductRow {
  id_produto: number
  nome_produto: string | null
  marca_produto: string | null
  categoria: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'ID do mercado não fornecido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, get all prices for this market
    const { data: prices, error: pricesError } = await supabase
      .from('Precos')
      .select('id_preco, preco, data_hora, id_produto')
      .eq('id_mercado', marketId)
      .order('data_hora', { ascending: false })

    if (pricesError) {
      console.error('Error fetching prices:', pricesError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar preços', details: pricesError.message },
        { status: 500 }
      )
    }

    const priceRows = prices as PriceRow[] | null

    if (!priceRows || priceRows.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0,
      })
    }

    // Get unique product IDs
    const productIds = [...new Set(
      priceRows
        .map(p => p.id_produto)
        .filter((id): id is number => id !== null)
    )]
    
    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0,
      })
    }

    // Fetch product details
    const { data: produtos, error: produtosError } = await supabase
      .from('Produtos')
      .select('id_produto, nome_produto, marca_produto, categoria')
      .in('id_produto', productIds)

    if (produtosError) {
      console.error('Error fetching products:', produtosError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produtos', details: produtosError.message },
        { status: 500 }
      )
    }

    const productRows = produtos as ProductRow[] | null

    // Create product lookup map
    const productLookup = new Map<number, ProductRow>(
      (productRows || []).map(p => [p.id_produto, p])
    )

    // Group by product and get the latest price
    const productMap = new Map<number, {
      id_produto: number
      nome_produto: string
      marca_produto: string | null
      categoria: string | null
      preco: number
      data_hora: string
    }>()

    for (const price of priceRows) {
      if (!price.id_produto) continue
      
      const produto = productLookup.get(price.id_produto)
      if (!produto) continue

      // Only keep the first (latest) price for each product
      if (!productMap.has(price.id_produto)) {
        productMap.set(price.id_produto, {
          id_produto: produto.id_produto,
          nome_produto: produto.nome_produto || 'Produto sem nome',
          marca_produto: produto.marca_produto,
          categoria: produto.categoria,
          preco: price.preco,
          data_hora: price.data_hora,
        })
      }
    }

    const products = Array.from(productMap.values())
      .sort((a, b) => a.nome_produto.localeCompare(b.nome_produto))

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    })
  } catch (error) {
    console.error('Error in products-by-market:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
