import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, sessionId, tipo, dados } = body

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'init_session') {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('Sessoes')
        .select('id_sessao')
        .eq('id_sessao', sessionId)
        .single()

      if (!existingSession) {
        // Create new session
        const userAgent = request.headers.get('user-agent') || ''
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

        await supabase
          .from('Sessoes')
          .insert({
            id_sessao: sessionId,
            ip_address: ip,
            user_agent: userAgent,
          })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'track_event') {
      if (!tipo) {
        return NextResponse.json(
          { success: false, error: 'tipo required' },
          { status: 400 }
        )
      }

      // Insert search/interaction
      await supabase
        .from('Pesquisas')
        .insert({
          id_sessao: sessionId,
          tipo,
          dados: dados || {},
        })

      return NextResponse.json({ success: true })
    }

    if (action === 'save_cart') {
      // Save cart search result
      const { produtos, mercado_recomendado, preco_total, latitude, longitude } = dados || {}

      await supabase
        .from('Carrinhos')
        .insert({
          id_sessao: sessionId,
          produtos: produtos || [],
          mercado_recomendado: mercado_recomendado || null,
          preco_total: preco_total || null,
          latitude_usuario: latitude || null,
          longitude_usuario: longitude || null,
        })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in track:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

