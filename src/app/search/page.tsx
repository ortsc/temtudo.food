'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import ProductSearchInput from '@/components/ProductSearchInput'
import MarketPriceCard from '@/components/MarketPriceCard'
import SimpleMap from '@/components/SimpleMap'

interface Product {
  id_produto: number
  nome_produto: string | null
  marca_produto: string | null
  categoria: string | null
}

interface MarketResult {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  preco: number
  lat: number
  lng: number
  distance?: number
  tier: 'best' | 'medium' | 'high'
}

export default function SearchPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [markets, setMarkets] = useState<MarketResult[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Default to São Paulo if geolocation fails
          setUserLocation({ lat: -23.5505, lng: -46.6333 })
        }
      )
    } else {
      setUserLocation({ lat: -23.5505, lng: -46.6333 })
    }
  }, [])

  // Search prices when product is selected
  const searchPrices = useCallback(async (product: Product) => {
    setLoading(true)
    setError(null)
    setMarkets([])

    try {
      const response = await fetch('/api/search-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.nome_produto,
          userLat: userLocation?.lat,
          userLng: userLocation?.lng,
        }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Erro no servidor. Tente novamente.')
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao buscar preços')
      }

      if (data.markets.length === 0) {
        setError('Nenhum preço encontrado para este produto')
      } else {
        setMarkets(data.markets)
        setSelectedMarketId(data.markets[0]?.id_mercado || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar preços')
    } finally {
      setLoading(false)
    }
  }, [userLocation])

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product)
    if (product) {
      searchPrices(product)
    } else {
      setMarkets([])
      setSelectedMarketId(null)
    }
  }

  const mapMarkers = markets.map(m => ({
    id: m.id_mercado,
    lat: m.lat,
    lng: m.lng,
    tier: m.tier,
    label: m.nome_mercado,
    price: m.preco,
  }))

  return (
    <>
      {/* Load Google Maps */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker`}
        onLoad={() => setMapsLoaded(true)}
      />

      <main className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-4 flex items-center gap-4 flex-shrink-0 z-50">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Comparar Preços</h1>
        </header>

        {/* Main Content - Responsive Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Map Section - Larger on both mobile and desktop */}
          <div className="h-[45vh] lg:h-full lg:flex-1 bg-gray-200 relative flex-shrink-0">
            {mapsLoaded && userLocation ? (
              <SimpleMap
                markers={mapMarkers}
                userLocation={userLocation}
                selectedMarkerId={selectedMarketId || undefined}
                onMarkerClick={setSelectedMarketId}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Carregando mapa...</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Bottom Panel */}
          <div className="flex-1 lg:w-[400px] lg:flex-none flex flex-col bg-gray-50 overflow-hidden">
            {/* Search Input - Fixed at top */}
            <div className="p-4 bg-white border-b border-gray-100 flex-shrink-0">
              <ProductSearchInput
                selectedProduct={selectedProduct}
                onSelect={handleProductSelect}
              />
            </div>

            {/* Scrollable Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="w-10 h-10 text-primary animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-500">Buscando melhores preços...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">{error}</p>
                  <p className="text-sm text-gray-400 mt-1">Tente buscar outro produto</p>
                </div>
              ) : selectedProduct && markets.length > 0 ? (
                <>
                  {/* Results Header */}
                  <div className="mb-3">
                    <h2 className="text-base font-bold text-gray-900">
                      Melhores Preços - {selectedProduct.nome_produto}
                    </h2>
                    <p className="text-xs text-gray-500">Ordenado por menor preço</p>
                  </div>

                  {/* Market List */}
                  <div className="space-y-2">
                    {markets.map((market, index) => (
                      <MarketPriceCard
                        key={market.id_mercado}
                        nome={market.nome_mercado}
                        preco={market.preco}
                        distance={market.distance}
                        tier={market.tier}
                        isFirst={index === 0}
                        onClick={() => setSelectedMarketId(market.id_mercado)}
                      />
                    ))}
                  </div>

                  {/* Savings Info */}
                  {markets.length >= 2 && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-primary text-sm">
                            Economize R$ {(markets[markets.length - 1].preco - markets[0].preco).toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            comprando no {markets[0].nome_mercado}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : !selectedProduct ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Busque um produto</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Digite o nome para comparar preços
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
