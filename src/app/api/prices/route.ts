import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ParsedProduct } from '@/lib/types'

interface PricesRequestBody {
  marketId: number
  products: ParsedProduct[]
}

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

    // Parse request body
    const body: PricesRequestBody = await request.json()
    const { marketId, products } = body

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'Mercado não especificado' },
        { status: 400 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum produto para salvar' },
        { status: 400 }
      )
    }

    // Verify market exists
    const { data: market, error: marketError } = await supabase
      .from('Mercados')
      .select('id_mercado')
      .eq('id_mercado', marketId)
      .single()

    if (marketError || !market) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      )
    }

    // Get or create user in Usuarios table
    let userId: number | null = null
    
    // Try to find existing user by email
    const { data: existingUser } = await supabase
      .from('Usuarios')
      .select('id_usuario')
      .eq('email_usuario', user.email)
      .maybeSingle()
    
    if (existingUser) {
      userId = existingUser.id_usuario
    } else {
      // Create user in Usuarios table
      const { data: newUser, error: userError } = await supabase
        .from('Usuarios')
        .insert({
          email_usuario: user.email,
          nome_usuario: user.user_metadata?.nome || user.email?.split('@')[0],
        })
        .select('id_usuario')
        .single()
      
      if (!userError && newUser) {
        userId = newUser.id_usuario
      }
    }

    const savedProducts: { productId: number; priceId: number }[] = []
    const errors: string[] = []

    // Process each product
    for (const product of products) {
      try {
        // Check if product already exists (by name and brand)
        let productId: number

        const { data: existingProduct } = await supabase
          .from('Produtos')
          .select('id_produto')
          .eq('nome_produto', product.nome)
          .eq('marca_produto', product.marca || '')
          .maybeSingle()

        if (existingProduct) {
          productId = existingProduct.id_produto
        } else {
          // Create new product
          const { data: newProduct, error: productError } = await supabase
            .from('Produtos')
            .insert({
              nome_produto: product.nome,
              marca_produto: product.marca,
              categoria: product.categoria,
            })
            .select('id_produto')
            .single()

          if (productError || !newProduct) {
            errors.push(`Erro ao criar produto: ${product.nome}`)
            continue
          }

          productId = newProduct.id_produto
        }

        // Insert price record
        const { data: newPrice, error: priceError } = await supabase
          .from('Precos')
          .insert({
            id_produto: productId,
            id_mercado: marketId,
            preco: product.preco,
            id_usuario: userId,
            data_hora: new Date().toISOString(),
          })
          .select('id_preco')
          .single()

        if (priceError || !newPrice) {
          errors.push(`Erro ao salvar preço: ${product.nome}`)
          continue
        }

        savedProducts.push({
          productId,
          priceId: newPrice.id_preco,
        })
      } catch (err) {
        errors.push(`Erro inesperado: ${product.nome}`)
        console.error('Error processing product:', err)
      }
    }

    // Return result
    if (savedProducts.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join('; ') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      saved: savedProducts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error saving prices:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao salvar dados'
      },
      { status: 500 }
    )
  }
}
