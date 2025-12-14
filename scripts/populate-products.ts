import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase URL or Service Role Key not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Product data with price ranges
const products = [
  { product: "Arroz (pacote 5 kg)", min_price_brl: 28.00, max_price_brl: 40.00, categoria: "Grãos" },
  { product: "Feijão Carioquinha (pacote 1 kg)", min_price_brl: 7.00, max_price_brl: 9.00, categoria: "Grãos" },
  { product: "Açúcar Refinado (pacote 5 kg)", min_price_brl: 16.00, max_price_brl: 22.00, categoria: "Básicos" },
  { product: "Café em Pó (pacote 500 g)", min_price_brl: 28.00, max_price_brl: 45.00, categoria: "Bebidas" },
  { product: "Farinha de Trigo (pacote 1 kg)", min_price_brl: 3.50, max_price_brl: 5.50, categoria: "Básicos" },
  { product: "Farinha de Mandioca Torrada (pacote 500 g)", min_price_brl: 5.00, max_price_brl: 8.50, categoria: "Básicos" },
  { product: "Batata (kg)", min_price_brl: 8.00, max_price_brl: 14.00, categoria: "Hortifruti" },
  { product: "Cebola (kg)", min_price_brl: 7.00, max_price_brl: 12.00, categoria: "Hortifruti" },
  { product: "Alho (kg)", min_price_brl: 15.00, max_price_brl: 25.00, categoria: "Hortifruti" },
  { product: "Ovos Brancos (dúzia)", min_price_brl: 12.00, max_price_brl: 18.00, categoria: "Proteínas" },
  { product: "Margarina (pote 250 g)", min_price_brl: 6.00, max_price_brl: 9.50, categoria: "Laticínios" },
  { product: "Extrato de Tomate (340 g)", min_price_brl: 4.00, max_price_brl: 7.50, categoria: "Enlatados" },
  { product: "Óleo de Soja (900 ml)", min_price_brl: 7.00, max_price_brl: 10.00, categoria: "Básicos" },
  { product: "Leite em Pó Integral (400 g)", min_price_brl: 15.00, max_price_brl: 23.00, categoria: "Laticínios" },
  { product: "Macarrão com Ovos (pacote 500 g)", min_price_brl: 2.50, max_price_brl: 5.00, categoria: "Massas" },
  { product: "Biscoito Maisena (pacote 200 g)", min_price_brl: 3.00, max_price_brl: 6.50, categoria: "Biscoitos" },
  { product: "Carne de Primeira (kg)", min_price_brl: 60.00, max_price_brl: 85.00, categoria: "Carnes" },
  { product: "Carne de Segunda sem Osso (kg)", min_price_brl: 40.00, max_price_brl: 65.00, categoria: "Carnes" },
  { product: "Frango Resfriado Inteiro (kg)", min_price_brl: 24.00, max_price_brl: 34.00, categoria: "Carnes" },
  { product: "Salsicha Avulsa (kg)", min_price_brl: 15.00, max_price_brl: 25.00, categoria: "Carnes" },
  { product: "Linguiça Fresca (kg)", min_price_brl: 20.00, max_price_brl: 30.00, categoria: "Carnes" },
  { product: "Queijo Muçarela Fatiado (kg)", min_price_brl: 45.00, max_price_brl: 75.00, categoria: "Laticínios" },
]

// Brand options for variety
const brands: Record<string, string[]> = {
  "Grãos": ["Camil", "Tio João", "Kicaldo", "Prato Fino", "Blue Ville"],
  "Básicos": ["União", "Dona Benta", "Sol", "Qualitá", "Globo"],
  "Bebidas": ["Pilão", "3 Corações", "Melitta", "Café do Ponto", "Orfeu"],
  "Hortifruti": ["Hortifruti", "Natural", "Orgânico", "Da Roça", ""],
  "Proteínas": ["Granja Mantiqueira", "Happy Eggs", "Katayama", "Qualitá", ""],
  "Laticínios": ["Qualy", "Vigor", "Itambé", "Nestlé", "Presidente"],
  "Enlatados": ["Elefante", "Quero", "Fugini", "Predilecta", "Heinz"],
  "Massas": ["Adria", "Renata", "Barilla", "Galo", "Qualitá"],
  "Biscoitos": ["Piraquê", "Mabel", "Marilan", "São Luiz", "Bauducco"],
  "Carnes": ["Friboi", "Minerva", "Swift", "Sadia", "Perdigão"],
}

// Price tiers (0-20%, 20-40%, etc.)
const TIERS = [
  { name: "Muito Barato", min: 0, max: 0.2 },
  { name: "Barato", min: 0.2, max: 0.4 },
  { name: "Médio", min: 0.4, max: 0.6 },
  { name: "Caro", min: 0.6, max: 0.8 },
  { name: "Muito Caro", min: 0.8, max: 1.0 },
]

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function main() {
  console.log('🚀 Starting database population...\n')

  // 1. DELETE ALL EXISTING DATA
  console.log('🗑️  Deleting existing data...')
  
  // Delete all prices first (foreign key constraint)
  const { error: deletePricesError } = await supabase
    .from('Precos')
    .delete()
    .neq('id_preco', 0) // Delete all
  
  if (deletePricesError) {
    console.error('   ❌ Error deleting prices:', deletePricesError.message)
  } else {
    console.log('   ✅ Deleted all prices')
  }

  // Delete all products
  const { error: deleteProductsError } = await supabase
    .from('Produtos')
    .delete()
    .neq('id_produto', 0) // Delete all
  
  if (deleteProductsError) {
    console.error('   ❌ Error deleting products:', deleteProductsError.message)
  } else {
    console.log('   ✅ Deleted all products')
  }

  console.log()

  // 2. Fetch all markets (with no limit)
  const { data: markets, error: marketsError } = await supabase
    .from('Mercados')
    .select('id_mercado, nome_mercado')
    .limit(1000) // Explicitly set high limit
  
  if (marketsError || !markets) {
    console.error('❌ Error fetching markets:', marketsError)
    return
  }

  console.log(`📍 Found ${markets.length} markets\n`)

  // 3. Create products in the database
  console.log('📦 Creating products...')
  const productIds: Map<string, number> = new Map()

  for (const prod of products) {
    const brandOptions = brands[prod.categoria] || [""]
    const brand = brandOptions[Math.floor(Math.random() * brandOptions.length)]

    const { data: newProduct, error } = await supabase
      .from('Produtos')
      .insert({
        nome_produto: prod.product,
        marca_produto: brand || null,
        categoria: prod.categoria,
      })
      .select('id_produto')
      .single()

    if (error) {
      console.error(`   ❌ Error creating ${prod.product}:`, error.message)
    } else if (newProduct) {
      productIds.set(prod.product, newProduct.id_produto)
      console.log(`   ✅ Created: ${prod.product}`)
    }
  }

  console.log(`\n📦 ${productIds.size} products created\n`)

  // 4. Assign markets to tiers
  const shuffledMarkets = shuffleArray(markets)
  const marketsPerTier = Math.ceil(shuffledMarkets.length / TIERS.length)

  const marketTiers: Map<number, { tierMin: number; tierMax: number; tierName: string }> = new Map()

  for (let i = 0; i < shuffledMarkets.length; i++) {
    const tierIndex = Math.min(Math.floor(i / marketsPerTier), TIERS.length - 1)
    const tier = TIERS[tierIndex]
    marketTiers.set(shuffledMarkets[i].id_mercado, {
      tierMin: tier.min,
      tierMax: tier.max,
      tierName: tier.name,
    })
  }

  // Log tier distribution
  const tierCounts = TIERS.map(t => ({
    name: t.name,
    count: Array.from(marketTiers.values()).filter(m => m.tierName === t.name).length
  }))
  console.log('📊 Market tier distribution:')
  tierCounts.forEach(t => console.log(`   ${t.name}: ${t.count} markets`))
  console.log()

  // 5. Create prices for EVERY market
  console.log('💰 Creating prices for ALL markets...\n')
  
  let totalPrices = 0
  let processedMarkets = 0

  // Prepare all prices to insert in batches
  const allPrices: Array<{
    id_produto: number
    id_mercado: number
    preco: number
    data_hora: string
  }> = []

  for (const market of markets) {
    const tier = marketTiers.get(market.id_mercado)
    if (!tier) continue

    // Select 80-100% of products randomly for this market (more products per market)
    const productPercentage = 0.8 + Math.random() * 0.2 // 80-100%
    const numProducts = Math.ceil(products.length * productPercentage)
    const selectedProducts = shuffleArray(products).slice(0, numProducts)

    for (const prod of selectedProducts) {
      const productId = productIds.get(prod.product)
      if (!productId) continue

      // Calculate price based on:
      // 1. Product's min/max range
      // 2. Market's tier (tier determines where in the range the price falls)
      const priceRange = prod.max_price_brl - prod.min_price_brl
      
      // Market tier determines the base position in the price range
      const tierMidpoint = (tier.tierMin + tier.tierMax) / 2
      
      // Add some randomness within the tier (±10% of tier range)
      const tierVariation = (tier.tierMax - tier.tierMin) * 0.5
      const pricePosition = tierMidpoint + randomInRange(-tierVariation, tierVariation)
      
      // Clamp to 0-1
      const clampedPosition = Math.max(0, Math.min(1, pricePosition))
      
      // Calculate final price
      let price = prod.min_price_brl + (priceRange * clampedPosition)
      
      // Round to 2 decimal places
      price = Math.round(price * 100) / 100

      allPrices.push({
        id_produto: productId,
        id_mercado: market.id_mercado,
        preco: price,
        data_hora: new Date().toISOString(),
      })
    }

    processedMarkets++
  }

  console.log(`📝 Prepared ${allPrices.length} prices for ${processedMarkets} markets`)
  console.log('📤 Inserting in batches...\n')

  // Insert in batches of 500
  const batchSize = 500
  for (let i = 0; i < allPrices.length; i += batchSize) {
    const batch = allPrices.slice(i, i + batchSize)
    const { error } = await supabase
      .from('Precos')
      .insert(batch)

    if (error) {
      console.error(`   ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
    } else {
      totalPrices += batch.length
      console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} prices (total: ${totalPrices})`)
    }
  }

  // 6. Summary
  console.log('\n📊 Summary:')
  console.log(`   Products: ${productIds.size}`)
  console.log(`   Markets with prices: ${processedMarkets}`)
  console.log(`   Total prices: ${totalPrices}`)
  console.log(`   Avg products per market: ${(totalPrices / processedMarkets).toFixed(1)}`)

  // Verify all markets have prices
  const { data: marketPriceCounts } = await supabase
    .from('Precos')
    .select('id_mercado')
  
  const uniqueMarkets = new Set(marketPriceCounts?.map(p => p.id_mercado))
  console.log(`   Markets with at least 1 price: ${uniqueMarkets.size}/${markets.length}`)

  if (uniqueMarkets.size < markets.length) {
    console.log(`   ⚠️  ${markets.length - uniqueMarkets.size} markets without prices!`)
  } else {
    console.log(`   ✅ All markets have prices!`)
  }

  console.log('\n✨ Done!')
}

main().catch(console.error)
