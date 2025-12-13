import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Supabase credentials
const supabaseUrl = 'https://juiioeyjnlmqihhockjk.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aWlvZXlqbmxtcWloaG9ja2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMjg4MCwiZXhwIjoyMDgxMTg4ODgwfQ.IQvs8D9r6M07YPeiyFyBSdx3ribXLpkgxEE7rcsWQ9A'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Supermarket {
  title: string
  categoryName: string
  address: string
  neighborhood: string
  street: string
  city: string
  postalCode: string
  state: string
  countryCode: string
  website: string | null
  phone: string | null
  phoneUnformatted: string | null
  location: {
    lat: number
    lng: number
  }
}

async function importMercados() {
  console.log('🚀 Starting import...\n')

  // Read JSON file
  const jsonPath = path.join(__dirname, '..', 'supermarkets-leblon.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const supermarkets: Supermarket[] = JSON.parse(rawData)

  console.log(`📦 Found ${supermarkets.length} supermarkets to import\n`)

  // Filter only supermarkets (exclude other categories if needed)
  const validCategories = ['Supermercado', 'Mercado', 'Hipermercado', 'Atacadista', 'Mercado de produtos agrícolas']
  const filteredMarkets = supermarkets.filter(s => 
    validCategories.some(cat => s.categoryName?.toLowerCase().includes(cat.toLowerCase()))
  )

  console.log(`🔍 Filtered to ${filteredMarkets.length} valid supermarkets\n`)

  // Convert state names to abbreviations
  const stateAbbreviations: Record<string, string> = {
    'Rio de Janeiro': 'RJ',
    'São Paulo': 'SP',
    'Minas Gerais': 'MG',
    'Bahia': 'BA',
    'Paraná': 'PR',
    'Rio Grande do Sul': 'RS',
    'Pernambuco': 'PE',
    'Ceará': 'CE',
    'Pará': 'PA',
    'Santa Catarina': 'SC',
    'Goiás': 'GO',
    'Maranhão': 'MA',
    'Amazonas': 'AM',
    'Espírito Santo': 'ES',
    'Paraíba': 'PB',
    'Rio Grande do Norte': 'RN',
    'Mato Grosso': 'MT',
    'Alagoas': 'AL',
    'Piauí': 'PI',
    'Distrito Federal': 'DF',
    'Mato Grosso do Sul': 'MS',
    'Sergipe': 'SE',
    'Rondônia': 'RO',
    'Tocantins': 'TO',
    'Acre': 'AC',
    'Amapá': 'AP',
    'Roraima': 'RR',
  }

  // Prepare data for insertion
  const mercadosData = filteredMarkets.map(market => ({
    nome_mercado: market.title,
    endereco_mercado: market.street || market.address,
    cidade_mercado: market.city,
    estado_mercado: stateAbbreviations[market.state] || market.state,
    cep_mercado: market.postalCode,
    latitude: market.location?.lat,
    longitude: market.location?.lng,
    telefone_mercado: market.phone,
    website_mercado: market.website,
    bairro_mercado: market.neighborhood,
  }))

  // Remove duplicates based on name + address
  const uniqueMarkets = mercadosData.filter((market, index, self) =>
    index === self.findIndex(m => 
      m.nome_mercado === market.nome_mercado && 
      m.endereco_mercado === market.endereco_mercado
    )
  )

  console.log(`🧹 Removed duplicates: ${uniqueMarkets.length} unique markets\n`)

  // Insert in batches of 50
  const batchSize = 50
  let inserted = 0
  let errors = 0

  for (let i = 0; i < uniqueMarkets.length; i += batchSize) {
    const batch = uniqueMarkets.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('Mercados')
      .insert(batch)
      .select('id_mercado')

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += data?.length || 0
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length} markets`)
    }
  }

  console.log('\n📊 Import Summary:')
  console.log(`   ✅ Inserted: ${inserted}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📦 Total processed: ${uniqueMarkets.length}`)
}

importMercados()
  .then(() => {
    console.log('\n✨ Import complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n💥 Import failed:', err)
    process.exit(1)
  })

