'use client'

interface MarketPriceCardProps {
  nome: string
  preco: number
  distance?: number
  tier: 'best' | 'medium' | 'high'
  isFirst: boolean
  onClick?: () => void
}

export default function MarketPriceCard({ 
  nome, 
  preco, 
  distance, 
  tier, 
  isFirst,
  onClick 
}: MarketPriceCardProps) {
  const priceColor = tier === 'best' 
    ? 'text-primary' 
    : tier === 'medium' 
    ? 'text-orange-500' 
    : 'text-red-500'

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isFirst && (
            <span className="inline-block px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-lg mb-2">
              Melhor Preço
            </span>
          )}
          <h3 className="font-semibold text-gray-900">{nome}</h3>
          {distance !== undefined && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{distance.toFixed(1)} km</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${priceColor}`}>
            R$ {preco.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-xs text-gray-400">/un</div>
        </div>
      </div>
    </button>
  )
}

