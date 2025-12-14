import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, endereco, cidade, estado, telefone, email } = body

    if (!nome || !endereco || !cidade || !estado) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('MercadosPendentes')
      .insert({
        nome,
        endereco,
        cidade,
        estado,
        telefone: telefone || null,
        email_contato: email || null,
        status: 'pending',
      })

    if (error) {
      console.error('Error inserting pending market:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in submit market:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}

