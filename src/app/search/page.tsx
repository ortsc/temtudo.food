'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import ProductSearchInput from '@/components/ProductSearchInput'
import MarketPriceCard from '@/components/MarketPriceCard'
import MarketProfile from '@/components/MarketProfile'
import SimpleMap, { SimpleMapRef } from '@/components/SimpleMap'

interface Product {
  id_produto: number
  nome_produto: string | null
  marca_produto: string | null
  categoria: string | null
}

interface MarketProduct {
  id_produto: number
  nome_produto: string
  marca_produto: string | null
  categoria: string | null
  preco: number
  data_hora: string
}

interface MarketResult {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  bairro_mercado: string | null
  preco: number
  lat: number
  lng: number
  distance?: number
  tier: 'best' | 'medium' | 'high'
}

interface AllMarket {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  cidade_mercado: string | null
  estado_mercado: string | null
  bairro_mercado: string | null
  telefone_mercado: string | null
  website_mercado: string | null
  lat: number
  lng: number
  avgPrice: number | null
  productCount: number
  tier: 'cheap' | 'medium' | 'expensive' | 'no-data'
  distance?: number
}

type TabType = 'produtos' | 'mercados'
type ProductViewMode = 'search' | 'market-products'

interface ViewingMarket {
  id_mercado: number
  nome_mercado: string
  bairro_mercado: string | null
  tier: 'cheap' | 'medium' | 'expensive' | 'no-data'
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<TabType>('mercados')
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>('search')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [markets, setMarkets] = useState<MarketResult[]>([])
  const [allMarkets, setAllMarkets] = useState<AllMarket[]>([])
  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAllMarkets, setLoadingAllMarkets] = useState(true)
  const [loadingMarketProducts, setLoadingMarketProducts] = useState(false)
  const [viewingMarket, setViewingMarket] = useState<ViewingMarket | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null) // in km
  
  const mapRef = useRef<SimpleMapRef>(null)

  // Get user location on mount with high accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      // First, get a quick low-accuracy position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Quick location:', position.coords.latitude, position.coords.longitude, 'accuracy:', position.coords.accuracy, 'm')
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationAccuracy(position.coords.accuracy)
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      )
      
      // Then, get high-accuracy position (may take longer)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('High accuracy location:', position.coords.latitude, position.coords.longitude, 'accuracy:', position.coords.accuracy, 'm')
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationAccuracy(position.coords.accuracy)
        },
        (error) => {
          console.warn('High accuracy geolocation error:', error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // Force fresh
        }
      )
    } else {
      setUserLocation({ lat: -22.9838, lng: -43.2244 })
    }
  }, [])

  // Fetch all markets on mount
  useEffect(() => {
    async function fetchAllMarkets() {
      try {
        const response = await fetch('/api/markets')
        const contentType = response.headers.get('content-type')
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Invalid response from markets API')
          return
        }

        const data = await response.json()
        
        if (data.success && data.markets) {
          setAllMarkets(data.markets)
        }
      } catch (err) {
        console.error('Error fetching all markets:', err)
      } finally {
        setLoadingAllMarkets(false)
      }
    }

    fetchAllMarkets()
  }, [])

  // Fetch products when a market is selected for viewing
  const fetchMarketProducts = useCallback(async (marketId: number) => {
    console.log('Fetching products for market:', marketId)
    setLoadingMarketProducts(true)
    setMarketProducts([]) // Clear previous products
    try {
      const response = await fetch(`/api/products-by-market?marketId=${marketId}`)
      const data = await response.json()
      console.log('Products API response:', data)
      
      if (data.success && data.products) {
        setMarketProducts(data.products)
      } else {
        console.error('Failed to fetch products:', data.error)
      }
    } catch (err) {
      console.error('Error fetching market products:', err)
    } finally {
      setLoadingMarketProducts(false)
    }
  }, [])

  // Calculate distances
  const marketsWithDistance = allMarkets.map(market => ({
    ...market,
    distance: userLocation 
      ? calculateDistance(userLocation.lat, userLocation.lng, market.lat, market.lng)
      : undefined
  })).sort((a, b) => (a.distance || 999) - (b.distance || 999))

  // Apply distance filter
  const filteredMarkets = distanceFilter
    ? marketsWithDistance.filter(m => m.distance !== undefined && m.distance <= distanceFilter)
    : marketsWithDistance

  // Get selected market details
  const selectedMarketDetails = selectedMarketId 
    ? marketsWithDistance.find(m => m.id_mercado === selectedMarketId)
    : null

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
    setProductViewMode('search')
    if (product) {
      searchPrices(product)
    } else {
      setMarkets([])
      setSelectedMarketId(null)
      setError(null)
    }
  }

  const handleMarketSelect = (id: number) => {
    setSelectedMarketId(id)
    setActiveTab('mercados') // Switch to mercados tab
    mapRef.current?.goToMarker(id)
  }

  const handleViewMarketProducts = (marketId: number) => {
    // Save market details before switching views
    const market = marketsWithDistance.find(m => m.id_mercado === marketId)
    if (market) {
      setViewingMarket({
        id_mercado: market.id_mercado,
        nome_mercado: market.nome_mercado,
        bairro_mercado: market.bairro_mercado,
        tier: market.tier,
      })
    }
    setSelectedMarketId(marketId)
    setProductViewMode('market-products')
    setActiveTab('produtos')
    fetchMarketProducts(marketId)
  }

  const handleBackToSearch = () => {
    setProductViewMode('search')
    setMarketProducts([])
    setViewingMarket(null)
    setSelectedProduct(null)
    setMarkets([])
  }

  const [locationLoading, setLocationLoading] = useState(false)
  
  const handleGoToMyLocation = () => {
    setSelectedMarketId(null)
    setLocationLoading(true)
    
    // Re-request location with high accuracy when button is clicked
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Button click - new location:', position.coords.latitude, position.coords.longitude, 'accuracy:', position.coords.accuracy, 'm')
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(newLocation)
          setLocationAccuracy(position.coords.accuracy)
          setLocationLoading(false)
          // The map will update via the useEffect when userLocation changes
          setTimeout(() => mapRef.current?.goToUserLocation(), 100)
        },
        (error) => {
          console.warn('Location error on button click:', error.message)
          setLocationLoading(false)
          // If fails, just go to current location
          mapRef.current?.goToUserLocation()
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // Force fresh location
        }
      )
    } else {
      setLocationLoading(false)
      mapRef.current?.goToUserLocation()
    }
  }

  // Determine which markers to show
  const mapMarkers = selectedProduct && markets.length > 0
    ? markets.map(m => ({
        id: m.id_mercado,
        lat: m.lat,
        lng: m.lng,
        tier: m.tier as 'best' | 'medium' | 'high',
        label: m.nome_mercado,
        price: m.preco,
      }))
    : filteredMarkets.map(m => ({
        id: m.id_mercado,
        lat: m.lat,
        lng: m.lng,
        tier: m.tier as 'cheap' | 'medium' | 'expensive' | 'no-data',
        label: m.nome_mercado,
        price: m.avgPrice || undefined,
      }))

  return (
    <>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Map Section */}
          <div className="h-[45vh] lg:h-full lg:flex-1 bg-gray-200 relative flex-shrink-0">
            {mapsLoaded && userLocation && !loadingAllMarkets ? (
              <SimpleMap
                ref={mapRef}
                markers={mapMarkers}
                userLocation={userLocation}
                selectedMarkerId={selectedMarketId || undefined}
                onMarkerClick={handleMarketSelect}
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

            {/* My Location Button */}
            <div className="absolute bottom-20 right-4 z-10 flex flex-col items-end gap-2">
              {locationAccuracy && (
                <div className={`text-xs px-2 py-1 rounded-full shadow ${
                  locationAccuracy <= 50 ? 'bg-green-100 text-green-700' :
                  locationAccuracy <= 500 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  ±{Math.round(locationAccuracy)}m
                </div>
              )}
              <button
                onClick={handleGoToMyLocation}
                disabled={locationLoading}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Atualizar minha localização"
              >
                {locationLoading ? (
                  <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Map Legend */}
            {!selectedProduct && !selectedMarketId && filteredMarkets.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg text-xs">
                <div className="font-semibold text-gray-700 mb-2">Preço Médio</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Mais barato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-600">Preço médio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">Mais caro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600">Sem dados</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Market Profile - Mobile overlay */}
            {selectedMarketDetails && activeTab === 'mercados' && (
              <div className="absolute bottom-4 left-4 right-4 lg:hidden z-20">
                <MarketProfile
                  nome={selectedMarketDetails.nome_mercado}
                  endereco={selectedMarketDetails.endereco_mercado}
                  bairro={selectedMarketDetails.bairro_mercado}
                  cidade={selectedMarketDetails.cidade_mercado}
                  estado={selectedMarketDetails.estado_mercado}
                  telefone={selectedMarketDetails.telefone_mercado}
                  website={selectedMarketDetails.website_mercado}
                  avgPrice={selectedMarketDetails.avgPrice}
                  productCount={selectedMarketDetails.productCount}
                  tier={selectedMarketDetails.tier}
                  distance={selectedMarketDetails.distance}
                  onClose={() => setSelectedMarketId(null)}
                  onViewProducts={selectedMarketDetails.productCount > 0 
                    ? () => handleViewMarketProducts(selectedMarketDetails.id_mercado)
                    : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 lg:w-[400px] lg:flex-none flex flex-col bg-gray-50 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex bg-white border-b border-gray-100 flex-shrink-0">
              <button
                onClick={() => setActiveTab('produtos')}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'produtos' 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Produtos
                </div>
                {activeTab === 'produtos' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('mercados')}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'mercados' 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Mercados
                </div>
                {activeTab === 'mercados' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Produtos Tab */}
              {activeTab === 'produtos' && (
                <div className="p-4">
                  {/* View Mode: Market Products */}
                  {productViewMode === 'market-products' && viewingMarket ? (
                    <>
                      {/* Back button and market info */}
                      <div className="mb-4">
                        <button
                          onClick={handleBackToSearch}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Voltar para busca
                        </button>
                        
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              viewingMarket.tier === 'cheap' ? 'bg-green-100' :
                              viewingMarket.tier === 'medium' ? 'bg-orange-100' :
                              viewingMarket.tier === 'expensive' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}>
                              <svg className={`w-6 h-6 ${
                                viewingMarket.tier === 'cheap' ? 'text-green-600' :
                                viewingMarket.tier === 'medium' ? 'text-orange-600' :
                                viewingMarket.tier === 'expensive' ? 'text-red-600' :
                                'text-gray-400'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{viewingMarket.nome_mercado}</h3>
                              <p className="text-sm text-gray-500">{viewingMarket.bairro_mercado}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-base font-bold text-gray-900 mb-1">
                        Produtos Disponíveis
                      </h2>
                      <p className="text-xs text-gray-500 mb-4">
                        {marketProducts.length} produtos com preço cadastrado
                      </p>

                      {loadingMarketProducts ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <svg className="w-10 h-10 text-primary animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="text-gray-500">Carregando produtos...</p>
                        </div>
                      ) : marketProducts.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium">Nenhum produto cadastrado</p>
                          <p className="text-sm text-gray-400 mt-1">Seja o primeiro a contribuir!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {marketProducts.map((product) => (
                            <div
                              key={product.id_produto}
                              className="bg-white rounded-xl p-4 border border-gray-100"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate">{product.nome_produto}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {product.marca_produto && (
                                      <span className="text-xs text-gray-500">{product.marca_produto}</span>
                                    )}
                                    {product.categoria && (
                                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                        {product.categoria}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="text-lg font-bold text-primary">
                                    R$ {product.preco.toFixed(2).replace('.', ',')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* View Mode: Search */
                    <>
                      {/* Search Input */}
                      <div className="mb-4">
                        <ProductSearchInput
                          selectedProduct={selectedProduct}
                          onSelect={handleProductSelect}
                        />
                      </div>

                      {/* Distance Filter */}
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Filtrar por distância:</span>
                        <div className="flex gap-1">
                          {[null, 1, 3, 5, 10].map((km) => (
                            <button
                              key={km ?? 'all'}
                              onClick={() => setDistanceFilter(km)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                distanceFilter === km
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {km === null ? 'Todos' : `${km} km`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Results */}
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
                          <div className="mb-3">
                            <h2 className="text-base font-bold text-gray-900">
                              Melhores Preços - {selectedProduct.nome_produto}
                            </h2>
                            <p className="text-xs text-gray-500">Ordenado por menor preço</p>
                          </div>

                          <div className="space-y-2">
                            {markets.map((market, index) => (
                              <MarketPriceCard
                                key={market.id_mercado}
                                nome={market.nome_mercado}
                                preco={market.preco}
                                distance={market.distance}
                                tier={market.tier}
                                isFirst={index === 0}
                                onClick={() => handleMarketSelect(market.id_mercado)}
                              />
                            ))}
                          </div>

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
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium">Busque um produto</p>
                          <p className="text-sm text-gray-400 mt-1">
                            ou selecione um mercado para ver seus produtos
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Mercados Tab */}
              {activeTab === 'mercados' && (
                <div className="p-4">
                  {/* Distance Filter */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Distância:</span>
                    <div className="flex gap-1 flex-wrap">
                      {[null, 1, 3, 5, 10].map((km) => (
                        <button
                          key={km ?? 'all'}
                          onClick={() => setDistanceFilter(km)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            distanceFilter === km
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {km === null ? 'Todos' : `${km} km`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Market Profile on Desktop */}
                  {selectedMarketDetails && (
                    <div className="hidden lg:block mb-4">
                      <MarketProfile
                        nome={selectedMarketDetails.nome_mercado}
                        endereco={selectedMarketDetails.endereco_mercado}
                        bairro={selectedMarketDetails.bairro_mercado}
                        cidade={selectedMarketDetails.cidade_mercado}
                        estado={selectedMarketDetails.estado_mercado}
                        telefone={selectedMarketDetails.telefone_mercado}
                        website={selectedMarketDetails.website_mercado}
                        avgPrice={selectedMarketDetails.avgPrice}
                        productCount={selectedMarketDetails.productCount}
                        tier={selectedMarketDetails.tier}
                        distance={selectedMarketDetails.distance}
                        onClose={() => setSelectedMarketId(null)}
                        onViewProducts={selectedMarketDetails.productCount > 0 
                          ? () => handleViewMarketProducts(selectedMarketDetails.id_mercado)
                          : undefined
                        }
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <h2 className="text-base font-bold text-gray-900">
                      {selectedMarketDetails ? 'Outros Mercados' : 'Mercados Próximos'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {filteredMarkets.length} mercados {distanceFilter ? `até ${distanceFilter} km` : 'encontrados'}
                    </p>
                  </div>

                  {loadingAllMarkets ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <svg className="w-10 h-10 text-primary animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-gray-500">Carregando mercados...</p>
                    </div>
                  ) : filteredMarkets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhum mercado encontrado</p>
                      {distanceFilter && (
                        <button
                          onClick={() => setDistanceFilter(null)}
                          className="mt-2 text-primary text-sm hover:underline"
                        >
                          Remover filtro de distância
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMarkets
                        .filter(m => m.id_mercado !== selectedMarketId)
                        .slice(0, 15)
                        .map((market) => (
                        <button
                          key={market.id_mercado}
                          onClick={() => handleMarketSelect(market.id_mercado)}
                          className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              market.tier === 'cheap' ? 'bg-green-100' :
                              market.tier === 'medium' ? 'bg-orange-100' :
                              market.tier === 'expensive' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}>
                              <svg className={`w-5 h-5 ${
                                market.tier === 'cheap' ? 'text-green-600' :
                                market.tier === 'medium' ? 'text-orange-600' :
                                market.tier === 'expensive' ? 'text-red-600' :
                                'text-gray-400'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{market.nome_mercado}</h3>
                              {market.bairro_mercado && (
                                <p className="text-sm text-gray-500 truncate">{market.bairro_mercado}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                {market.distance !== undefined && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    {market.distance.toFixed(1)} km
                                  </span>
                                )}
                                {market.productCount > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {market.productCount} produtos
                                  </span>
                                )}
                              </div>
                            </div>
                            {market.avgPrice && (
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-gray-400">Média</p>
                                <p className={`font-bold ${
                                  market.tier === 'cheap' ? 'text-green-600' :
                                  market.tier === 'medium' ? 'text-orange-600' :
                                  market.tier === 'expensive' ? 'text-red-600' :
                                  'text-gray-400'
                                }`}>
                                  R$ {market.avgPrice.toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
