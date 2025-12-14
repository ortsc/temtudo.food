'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MarketPriceCard from '@/components/MarketPriceCard'
import MarketProfile from '@/components/MarketProfile'
import ShoppingCart from '@/components/ShoppingCart'
import ContributePanel from '@/components/ContributePanel'
import SimpleMap, { SimpleMapRef } from '@/components/SimpleMap'
import { initSession, trackEvent } from '@/lib/session'
import { Suspense } from 'react'

interface CartItem {
  id_produto: number
  nome_produto: string
  marca_produto: string | null
  categoria: string | null
  quantidade: number
}

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

// Interfaces for Cart Optimization Result (matching ShoppingCart)
interface CartOptimizationResult {
  bestMarket: {
    id_mercado: number
    nome_mercado: string
    endereco_mercado: string | null
    bairro_mercado: string | null
    totalPrice: number
    availableCount: number
    missingProducts: string[]
    distance?: number
    score: number
  } | null
  potentialMarkets: Array<{
    id_mercado: number
    nome_mercado: string
    endereco_mercado: string | null
    bairro_mercado: string | null
    totalPrice: number
    availableCount: number
    missingProducts: string[]
    distance?: number
    score: number
  }>
  allProducts: Array<{
    id_produto: number
    nome_produto: string
    quantidade: number
    bestMarket: {
      id_mercado: number
      nome_mercado: string
      preco: number
      total: number
    } | null
    savings: number
  }>
  totalSavings: number
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

type TabType = 'carrinho' | 'mercados' | 'contribuir'
type ProductViewMode = 'market-products' // simplified
type SortMode = 'distance' | 'price'

interface ViewingMarket {
  id_mercado: number
  nome_mercado: string
  bairro_mercado: string | null
  tier: 'cheap' | 'medium' | 'expensive' | 'no-data'
}

interface User {
  id: string
  email?: string
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

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('carrinho')
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>('market-products')
  const [allMarkets, setAllMarkets] = useState<AllMarket[]>([])
  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([])
  const [loadingAllMarkets, setLoadingAllMarkets] = useState(true)
  const [loadingMarketProducts, setLoadingMarketProducts] = useState(false)
  const [viewingMarket, setViewingMarket] = useState<ViewingMarket | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('distance')
  const [user, setUser] = useState<User | null>(null)
  const [showAddMarketModal, setShowAddMarketModal] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  
  // Lifted state for ShoppingCart
  const [cartResult, setCartResult] = useState<CartOptimizationResult | null>(null)
  const [showCartResult, setShowCartResult] = useState(false)
  
  const mapRef = useRef<SimpleMapRef>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Handle query params
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'contribuir') {
      setActiveTab('contribuir')
    }
  }, [searchParams])

  // Check auth state and init session
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    checkAuth()
    
    // Initialize anonymous session for tracking
    initSession()
  }, [supabase.auth])

  // Get user location on mount with high accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationAccuracy(position.coords.accuracy)
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      )
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
          maximumAge: 0,
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
    setLoadingMarketProducts(true)
    setMarketProducts([])
    try {
      const response = await fetch(`/api/products-by-market?marketId=${marketId}`)
      const data = await response.json()
      
      if (data.success && data.products) {
        setMarketProducts(data.products)
      }
    } catch (err) {
      console.error('Error fetching market products:', err)
    } finally {
      setLoadingMarketProducts(false)
    }
  }, [])

  // Calculate distances and sort
  const marketsWithDistance = allMarkets.map(market => ({
    ...market,
    distance: userLocation 
      ? calculateDistance(userLocation.lat, userLocation.lng, market.lat, market.lng)
      : undefined
  })).sort((a, b) => {
    if (sortMode === 'price') {
      const priceA = a.avgPrice ?? Infinity
      const priceB = b.avgPrice ?? Infinity
      return priceA - priceB
    }
    return (a.distance || 999) - (b.distance || 999)
  })

  // Apply distance filter
  const filteredMarkets = distanceFilter
    ? marketsWithDistance.filter(m => m.distance !== undefined && m.distance <= distanceFilter)
    : marketsWithDistance

  // Get selected market details
  const selectedMarketDetails = selectedMarketId 
    ? marketsWithDistance.find(m => m.id_mercado === selectedMarketId)
    : null

  const handleMarketSelect = (id: number) => {
    setSelectedMarketId(id)
    setActiveTab('mercados')
    mapRef.current?.goToMarker(id)
    
    // Track market view
    const market = marketsWithDistance.find(m => m.id_mercado === id)
    if (market) {
      trackEvent('market_view', {
        marketId: id,
        marketName: market.nome_mercado,
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
      })
    }
  }

  const handleViewMarketProducts = (marketId: number) => {
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
    // Here we switch to a specialized view inside 'mercados' tab instead of switching to products tab
    // We'll create a temporary override state or just use activeTab logic
    setActiveTab('mercados') 
    setProductViewMode('market-products')
    fetchMarketProducts(marketId)
  }

  const handleBackToMarkets = () => {
    setProductViewMode('market-products') // keep default
    setMarketProducts([])
    setViewingMarket(null)
    setSelectedMarketId(null)
  }

  const [locationLoading, setLocationLoading] = useState(false)
  
  const handleGoToMyLocation = () => {
    setSelectedMarketId(null)
    setLocationLoading(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(newLocation)
          setLocationAccuracy(position.coords.accuracy)
          setLocationLoading(false)
          setTimeout(() => mapRef.current?.goToUserLocation(), 100)
        },
        (error) => {
          console.warn('Location error on button click:', error.message)
          setLocationLoading(false)
          mapRef.current?.goToUserLocation()
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    } else {
      setLocationLoading(false)
      mapRef.current?.goToUserLocation()
    }
  }

  // Determine which markers to show
  // For now just show all markets colored by tier
  const mapMarkers = filteredMarkets.map(m => ({
    id: m.id_mercado,
    lat: m.lat,
    lng: m.lng,
    tier: m.tier as 'cheap' | 'medium' | 'expensive' | 'no-data',
    label: m.nome_mercado,
    price: m.avgPrice || undefined,
  }))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleAddItem = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id_produto === product.id_produto)
      if (existing) {
        return prev.map(item => 
          item.id_produto === product.id_produto 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }
      return [...prev, {
        id_produto: product.id_produto,
        nome_produto: product.nome_produto || '',
        marca_produto: product.marca_produto,
        categoria: product.categoria,
        quantidade: 1
      }]
    })
    setActiveTab('carrinho')
  }

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id_produto === id) {
        const newQuantity = Math.max(1, item.quantidade + delta)
        return { ...item, quantidade: newQuantity }
      }
      return item
    }))
  }

  const handleRemoveFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id_produto !== id))
  }

  const handleClearCart = () => {
    setCartItems([])
    setCartResult(null)
    setShowCartResult(false)
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker,places`}
        onLoad={() => setMapsLoaded(true)}
      />

      <main className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-primary-dark text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0 z-50">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold">Temtudo</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowAddMarketModal(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Mercado
            </button>
            
            {user ? (
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:inline">Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 text-sm bg-white hover:bg-white/90 text-primary font-semibold rounded-lg transition-colors"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
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
            {!selectedMarketId && filteredMarkets.length > 0 && (
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

            {/* Mobile Add Market Button */}
            <button
              onClick={() => setShowAddMarketModal(true)}
              className="lg:hidden absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Sidebar */}
          <div className="flex-1 lg:w-[400px] lg:flex-none flex flex-col bg-gray-50 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex bg-white border-b border-gray-100 flex-shrink-0">
              <button
                onClick={() => setActiveTab('carrinho')}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'carrinho' 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Carrinho
                  {cartItems.length > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </div>
                {activeTab === 'carrinho' && (
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
              {user && (
                <button
                  onClick={() => setActiveTab('contribuir')}
                  className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors relative ${
                    activeTab === 'contribuir' 
                      ? 'text-primary' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Contribuir
                  </div>
                  {activeTab === 'contribuir' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                  )}
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Carrinho Tab */}
              {activeTab === 'carrinho' && (
                <div className="h-full">
                  <ShoppingCart
                    items={cartItems}
                    onRemoveItem={handleRemoveFromCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onClearCart={handleClearCart}
                    onAddItem={handleAddItem}
                    onMarketSelect={handleMarketSelect}
                    userLocation={userLocation}
                    result={cartResult}
                    setResult={setCartResult}
                    showResult={showCartResult}
                    setShowResult={setShowCartResult}
                  />
                </div>
              )}

              {/* Mercados Tab */}
              {activeTab === 'mercados' && (
                <div className="p-4">
                  {/* If viewing market products, show different UI */}
                  {viewingMarket ? (
                    <>
                      <div className="mb-4">
                        <button
                          onClick={handleBackToMarkets}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Voltar para lista
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
                          <p className="text-gray-600 font-medium">Nenhum produto cadastrado</p>
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
                    /* Default Market List View */
                    <>
                      {/* Filters Row */}
                      <div className="mb-4 space-y-3">
                        {/* Distance Filter */}
                        <div className="flex items-center gap-2">
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

                        {/* Sort Options */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Ordenar por:</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setSortMode('distance')}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                sortMode === 'distance'
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Distância
                            </button>
                            <button
                              onClick={() => setSortMode('price')}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                sortMode === 'price'
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Preço
                            </button>
                          </div>
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
                    </>
                  )}
                </div>
              )}

              {/* Contribuir Tab */}
              {activeTab === 'contribuir' && user && (
                <ContributePanel onSuccess={() => {
                  // Could refresh markets or show a toast
                }} />
              )}

              {/* Login prompt for non-logged users trying to contribute */}
              {activeTab === 'contribuir' && !user && (
                <div className="p-4 text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Faça login para contribuir</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Entre na sua conta para adicionar preços
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link
                      href="/login"
                      className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cadastrar
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Market Modal */}
      {showAddMarketModal && (
        <AddMarketModal onClose={() => setShowAddMarketModal(false)} />
      )}
    </>
  )
}

export default function AppPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Carregando...</div>}>
      <AppContent />
    </Suspense>
  )
}

// Add Market Modal Component
function AddMarketModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    telefone: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/markets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Error submitting market:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Adicionar Mercado</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Solicitação Enviada!</h3>
              <p className="text-gray-500 mb-6">
                Seu mercado foi enviado para aprovação. Nossa equipe irá analisar e adicionar em breve.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Mercado *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Supermercado Bom Preço"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: RJ"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="(21) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de contato</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="contato@mercado.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar para Aprovação'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
