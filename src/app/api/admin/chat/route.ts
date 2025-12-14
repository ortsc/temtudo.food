import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { messages, marketId } = body

        if (!marketId || !messages) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch Market Context (Reuse logic from report API)
        // Fetch market details
        const { data: market } = await supabase
            .from('Mercados')
            .select('*')
            .eq('id_mercado', marketId)
            .single()

        if (!market) {
            return NextResponse.json({ success: false, error: 'Market not found' }, { status: 404 })
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

        // Fetch recent searches
        const { data: searches } = await supabase
            .from('Pesquisas')
            .select('tipo, dados, created_at')
            .order('created_at', { ascending: false })
            .limit(20)

        // Prepare Context Data
        const productMap = new Map(products?.map(p => [p.id_produto, p]) || [])
        const pricesWithProducts = (prices || []).map(p => ({
            ...p,
            nome: productMap.get(p.id_produto)?.nome_produto || 'Desconhecido',
            categoria: productMap.get(p.id_produto)?.categoria || 'Outros'
        }))

        // Calculate detailed stats
        const categoryStats: Record<string, { count: number, avgPrice: number, total: number }> = {}
        pricesWithProducts.forEach(p => {
            const cat = p.categoria
            if (!categoryStats[cat]) categoryStats[cat] = { count: 0, avgPrice: 0, total: 0 }
            categoryStats[cat].count++
            categoryStats[cat].total += Number(p.preco)
        })

        Object.keys(categoryStats).forEach(cat => {
            categoryStats[cat].avgPrice = categoryStats[cat].total / categoryStats[cat].count
        })

        const searchedTerms: string[] = []
        searches?.forEach(s => {
            const d = s.dados as any
            if (d?.productName) searchedTerms.push(d.productName)
            if (d?.query) searchedTerms.push(d.query)
            if (Array.isArray(d?.produtos)) searchedTerms.push(...d.produtos)
            if (Array.isArray(d?.products)) searchedTerms.push(...d.products)
        })

        // Construct System Prompt with Context
        const systemPrompt = `Você é um consultor de negócios IA experiente para o mercado "${market.nome_mercado}".
    
    CONTEXTO DO MERCADO:
    - Localização: ${market.bairro_mercado || 'N/A'}, ${market.cidade_mercado || 'N/A'}
    - Total Produtos: ${prices?.length || 0}
    
    ESTATÍSTICAS DE PREÇOS (Recentes):
    ${Object.entries(categoryStats).map(([cat, stat]) =>
            `- ${cat}: ${stat.count} itens, Média R$ ${stat.avgPrice.toFixed(2)}`
        ).join('\n')}
    
    TOP 5 PRODUTOS MAIS CAROS:
    ${pricesWithProducts.sort((a, b) => b.preco - a.preco).slice(0, 5).map(p => `- ${p.nome}: R$ ${p.preco}`).join('\n')}

    BUSCAS RECENTES NA REGIÃO (O que clientes querem):
    ${searchedTerms.slice(0, 10).join(', ') || 'Nenhuma busca recente'}

    DIRETRIZES:
    - Responda de forma curta, direta e comercial.
    - Se perguntarem sobre "tomates", analise se temos tomates (ou categoria Hortifruti) e compare com o que os clientes buscam.
    - Dê conselhos práticos baseados nos dados acima.
    - Se não tiver dados suficientes sobre algo, diga honestamente mas tente inferir com base no setor.
    `

        // Call OpenAI
        const openai = new OpenAI({ apiKey: openaiApiKey })
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages // Pass previous conversation history
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        return NextResponse.json({
            success: true,
            role: 'assistant',
            content: completion.choices[0]?.message?.content
        })

    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
