'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/session'
import ProductSearchInput from '@/components/ProductSearchInput'

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

interface MarketResult {
  id_mercado: number
  nome_mercado: string
  endereco_mercado: string | null
  bairro_mercado: string | null
  totalPrice: number
  availableCount: number
  missingProducts: string[]
  distance?: number
  score: number
}

interface CartOptimizationResult {
  bestMarket: MarketResult | null
  potentialMarkets: MarketResult[]
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

interface ShoppingCartProps {
  items: CartItem[]
  onRemoveItem: (id: number) => void
  onUpdateQuantity: (id: number, delta: number) => void
  onClearCart: () => void
  onAddItem: (product: Product) => void
  onMarketSelect?: (marketId: number) => void
  userLocation: { lat: number; lng: number } | null

  // Lifted state props
  result: CartOptimizationResult | null
  setResult: (result: CartOptimizationResult | null) => void
  showResult: boolean
  setShowResult: (show: boolean) => void
}

export default function ShoppingCart({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  onAddItem,
  onMarketSelect,
  userLocation,
  result,
  setResult,
  showResult,
  setShowResult
}: ShoppingCartProps) {
  const [loading, setLoading] = useState(false)
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null)

  const optimizeCart = async () => {
    if (items.length === 0) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/cart-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: items.map(i => ({
            id_produto: i.id_produto,
            nome_produto: i.nome_produto,
            quantidade: i.quantidade
          })),
          userLat: userLocation?.lat,
          userLng: userLocation?.lng,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
        setShowResult(true)

        trackEvent('cart_optimize', {
          productCount: items.length,
          products: items.map(i => i.nome_produto),
          bestMarket: data.result.bestMarket?.nome_mercado,
          totalPrice: data.result.bestMarket?.totalPrice,
          userLat: userLocation?.lat,
          userLng: userLocation?.lng,
        })
      }
    } catch (err) {
      console.error('Error optimizing cart:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle adding product from search
  const handleProductSelect = (product: Product) => {
    onAddItem(product)
    setShowResult(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          Meu Carrinho
          {items.length > 0 && (
            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">
              {items.length}
            </span>
          )}
        </h3>

        <ProductSearchInput
          onSelect={handleProductSelect}
          selectedProduct={null}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {items.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Comece buscando um produto</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Adicione itens para ver onde comprar mais barato na sua região.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {items.map((item) => (
              <div
                key={item.id_produto}
                className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-medium text-gray-900 truncate">{item.nome_produto}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {item.marca_produto || item.categoria || 'Sem marca'}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id_produto, -1)}
                        disabled={item.quantidade <= 1}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-primary transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-900">{item.quantidade}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id_produto, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-primary transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id_produto)}
                  className="ml-2 text-gray-400 hover:text-red-500 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results Section */}
        {showResult && result && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Melhores Opções</h4>
              {result.totalSavings > 0 && (
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                  Economia de R$ {result.totalSavings.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>

            {/* Distance Filter */}
            <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">Distância:</span>
              <div className="flex gap-1">
                {[null, 1, 3, 5, 10].map((km) => (
                  <button
                    key={km ?? 'all'}
                    onClick={() => setDistanceFilter(km)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${distanceFilter === km
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {km === null ? 'Todos' : `${km} km`}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Markets */}
            {result.potentialMarkets
              .filter(m => distanceFilter === null || (m.distance !== undefined && m.distance <= distanceFilter))
              .map((market, index) => {
                const isWinner = index === 0
                const percentDiff = index > 0 && result.bestMarket
                  ? ((market.totalPrice - result.bestMarket.totalPrice) / result.bestMarket.totalPrice) * 100
                  : 0

                return (
                  <div
                    key={market.id_mercado}
                    onClick={() => onMarketSelect?.(market.id_mercado)}
                    className={`relative rounded-xl border p-4 transition-all cursor-pointer ${isWinner
                      ? 'bg-white border-green-500 ring-1 ring-green-500 shadow-md z-10'
                      : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                  >
                    {isWinner && (
                      <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Melhor Opção
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold text-gray-900">{market.nome_mercado}</h5>
                        <p className="text-xs text-gray-500">
                          {market.bairro_mercado && `${market.bairro_mercado} • `}
                          {market.distance && `${market.distance.toFixed(1)} km`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${isWinner ? 'text-green-600' : 'text-gray-900'}`}>
                          R$ {market.totalPrice.toFixed(2).replace('.', ',')}
                        </p>
                        {index > 0 && (
                          <p className="text-xs text-red-500 font-medium">
                            +{percentDiff.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-md ${market.availableCount === items.length
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                        }`}>
                        {market.availableCount} / {items.length} itens
                      </span>

                      {market.missingProducts.length > 0 && (
                        <span className="text-gray-400">
                          Faltam: {market.missingProducts.length}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={optimizeCart}
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Calculando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar Melhores Preços
              </>
            )}
          </button>

          <button
            onClick={onClearCart}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Limpar Carrinho
          </button>
        </div>
      )}
    </div>
  )
}
