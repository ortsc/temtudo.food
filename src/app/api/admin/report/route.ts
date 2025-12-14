import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { marketId } = body

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'marketId required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch market details
    const { data: market } = await supabase
      .from('Mercados')
      .select('*')
      .eq('id_mercado', marketId)
      .single()

    if (!market) {
      return NextResponse.json(
        { success: false, error: 'Market not found' },
        { status: 404 }
      )
    }

    // Fetch market's products and prices
    const { data: prices } = await supabase
      .from('Precos')
      .select('preco, id_produto, created_at')
      .eq('id_mercado', marketId)
      .order('created_at', { ascending: false })
      .limit(100)

    // Fetch product names
    const productIds = [...new Set((prices || []).map(p => p.id_produto))]
    const { data: products } = await supabase
      .from('Produtos')
      .select('id_produto, nome_produto, categoria')
      .in('id_produto', productIds.length > 0 ? productIds : [0])

    // Fetch recent searches in the region
    const { data: searches } = await supabase
      .from('Pesquisas')
      .select('tipo, dados, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    // Fetch cart data
    const { data: carts } = await supabase
      .from('Carrinhos')
      .select('produtos, preco_total, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    // Prepare context for AI
    const productMap = new Map(products?.map(p => [p.id_produto, p]) || [])
    const pricesWithProducts = (prices || []).map(p => ({
      ...p,
      produto: productMap.get(p.id_produto),
    }))

    // Calculate average prices by category
    const categoryPrices: Record<string, number[]> = {}
    pricesWithProducts.forEach(p => {
      const cat = p.produto?.categoria || 'Outros'
      if (!categoryPrices[cat]) categoryPrices[cat] = []
      categoryPrices[cat].push(Number(p.preco))
    })

    const categoryAverages = Object.entries(categoryPrices).map(([cat, prices]) => ({
      categoria: cat,
      precoMedio: prices.reduce((a, b) => a + b, 0) / prices.length,
      quantidade: prices.length,
    }))

    // Extract searched products from searches
    const searchedProducts: string[] = []
    searches?.forEach(s => {
      if (s.dados && typeof s.dados === 'object') {
        const dados = s.dados as Record<string, unknown>
        if (dados.productName) searchedProducts.push(dados.productName as string)
        if (dados.produtos && Array.isArray(dados.produtos)) {
          searchedProducts.push(...(dados.produtos as string[]))
        }
      }
    })

    // Count product searches
    const productSearchCounts: Record<string, number> = {}
    searchedProducts.forEach(p => {
      productSearchCounts[p] = (productSearchCounts[p] || 0) + 1
    })
    const topSearchedProducts = Object.entries(productSearchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Generate AI report
    const openai = new OpenAI({ apiKey: openaiApiKey })

    const prompt = `Você é um analista de mercado especializado em varejo alimentício no Brasil. 
Gere um relatório curto e prático para o dono do mercado "${market.nome_mercado}" localizado em ${market.bairro_mercado || ''}, ${market.cidade_mercado || ''}.

DADOS DO MERCADO:
- Total de produtos cadastrados: ${prices?.length || 0}
- Categorias: ${JSON.stringify(categoryAverages)}

PRODUTOS MAIS BUSCADOS NA REGIÃO:
${topSearchedProducts.length > 0 ? topSearchedProducts.map(([p, c]) => `- ${p}: ${c} buscas`).join('\n') : 'Nenhuma busca registrada ainda'}

CARRINHOS DE COMPRA RECENTES: ${carts?.length || 0} carrinhos

Com base nesses dados, forneça:
1. RESUMO EXECUTIVO (2-3 linhas)
2. OPORTUNIDADES DE PREÇO (produtos que você deveria ajustar o preço)
3. PRODUTOS EM ALTA (o que os consumidores estão buscando)
4. RECOMENDAÇÕES (ações práticas para aumentar vendas)

Mantenha o relatório conciso, máximo 300 palavras. Seja direto e prático.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de negócios especializado em supermercados brasileiros. Forneça insights práticos e acionáveis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const report = completion.choices[0]?.message?.content || 'Não foi possível gerar o relatório.'

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: 'Error generating report' },
      { status: 500 }
    )
  }
}

