import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { ParsedProduct, ShelfParseResponse } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get image from request
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Imagem não fornecida' },
        { status: 400 }
      )
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em análise de imagens de supermercados brasileiros.
Sua tarefa é analisar fotos de prateleiras e extrair APENAS produtos cujo PREÇO está CLARAMENTE VISÍVEL na imagem.

REGRAS IMPORTANTES:
1. SOMENTE extraia produtos que tenham o preço CLARAMENTE VISÍVEL na etiqueta de preço
2. NÃO adivinhe ou estime preços - se não conseguir ler o preço com certeza, NÃO inclua o produto
3. O preço deve ser um número decimal (ex: 6.89, não "R$ 6,89")
4. Se não houver NENHUM produto com preço visível, retorne um array vazio
5. A categoria deve ser genérica (ex: "Bebidas", "Laticínios", "Higiene", "Limpeza", "Alimentos", "Padaria")
6. A marca pode ser null se não for identificável
7. Seja conservador: é melhor retornar menos produtos com dados corretos do que muitos produtos com dados incorretos

Retorne APENAS o JSON, sem texto adicional.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta imagem de prateleira de supermercado.

IMPORTANTE: Extraia APENAS os produtos cujo PREÇO está CLARAMENTE VISÍVEL na imagem. 
Se você não conseguir ler o preço de um produto com certeza, NÃO o inclua.
Se nenhum preço estiver visível, retorne {"products": []}.

Retorne um JSON no formato:
{
  "products": [
    {
      "marca": "Nome da Marca ou null",
      "nome": "Nome do Produto",
      "categoria": "Categoria",
      "preco": 0.00
    }
  ]
}

Lembre-se: 
- Preços em formato numérico (6.89, não texto)
- APENAS produtos com preço CLARAMENTE VISÍVEL
- Se não tiver certeza do preço, NÃO inclua o produto`
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da IA')
    }

    // Parse the JSON response
    let parsedContent: { products: ParsedProduct[] }
    
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta')
      }
      parsedContent = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse AI response:', content)
      throw new Error('Erro ao interpretar resposta da IA')
    }

    // Validate and clean the products - FILTER OUT products with price 0 or invalid
    const products: ParsedProduct[] = (parsedContent.products || [])
      .map(p => ({
        marca: p.marca || null,
        nome: String(p.nome || 'Produto não identificado'),
        categoria: p.categoria || null,
        preco: typeof p.preco === 'number' ? p.preco : parseFloat(String(p.preco)) || 0
      }))
      .filter(p => p.preco > 0) // Only keep products with valid prices

    const result: ShelfParseResponse = {
      success: true,
      products
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error parsing shelf image:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar imagem',
        products: []
      },
      { status: 500 }
    )
  }
}
