// Database types for Temtudo - Matching existing Supabase schema

export interface Usuario {
  id_usuario: number
  created_at: string
  nome_usuario: string | null
  email_usuario: string
}

export interface Mercado {
  id_mercado: number
  created_at: string
  nome_mercado: string | null
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  cep_mercado: string | null
  latitude: number | null
  longitude: number | null
  telefone_mercado: string | null
  website_mercado: string | null
  bairro_mercado: string | null
}

export interface Produto {
  id_produto: number
  nome_produto: string | null
  marca_produto: string | null
  produto_image_url: string | null
  categoria: string | null
}

export interface Preco {
  id_preco: number
  created_at: string
  id_produto: number | null
  id_mercado: number | null
  id_usuario: number | null
  data_hora: string | null
  preco: number | null
}

// Types for parsed shelf data from AI
export interface ParsedProduct {
  marca: string | null
  nome: string
  categoria: string | null
  preco: number
}

export interface ShelfParseResponse {
  products: ParsedProduct[]
  success: boolean
  error?: string
}
