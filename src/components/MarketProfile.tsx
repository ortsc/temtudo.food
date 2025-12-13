'use client'

interface MarketProfileProps {
  nome: string
  endereco?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  telefone?: string | null
  website?: string | null
  avgPrice?: number | null
  productCount?: number
  tier?: 'cheap' | 'medium' | 'expensive' | 'no-data'
  distance?: number
  onClose?: () => void
  onViewProducts?: () => void
}

export default function MarketProfile({
  nome,
  endereco,
  bairro,
  cidade,
  estado,
  telefone,
  website,
  avgPrice,
  productCount,
  tier,
  distance,
  onClose,
  onViewProducts,
}: MarketProfileProps) {
  const tierColors = {
    cheap: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' },
    medium: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-500' },
    expensive: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
    'no-data': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-400' },
  }

  const colors = tier ? tierColors[tier] : tierColors['no-data']

  const tierLabels = {
    cheap: 'Preços Baixos',
    medium: 'Preços Médios',
    expensive: 'Preços Altos',
    'no-data': 'Sem dados de preço',
  }

  // Extract domain from website for display
  const websiteDisplay = website ? website.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] : null

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className={`${colors.bg} ${colors.border} border-b p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{nome}</h2>
            {bairro && (
              <p className="text-sm text-gray-600 mt-0.5">{bairro}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Price tier badge */}
        {tier && (
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
            <div className={`w-2 h-2 rounded-full ${
              tier === 'cheap' ? 'bg-green-500' :
              tier === 'medium' ? 'bg-orange-500' :
              tier === 'expensive' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            {tierLabels[tier]}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Distância</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">
            {distance !== undefined ? `${distance.toFixed(1)} km` : '-'}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Preço Médio</p>
          <p className={`text-lg font-bold mt-0.5 ${colors.icon}`}>
            {avgPrice ? `R$ ${avgPrice.toFixed(2).replace('.', ',')}` : '-'}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Produtos</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">
            {productCount || 0}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Address */}
        {endereco && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{endereco}</p>
              {cidade && estado && (
                <p className="text-xs text-gray-500 mt-0.5">{cidade}, {estado}</p>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
        {telefone && (
          <a
            href={`tel:${telefone.replace(/\D/g, '')}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{telefone}</p>
              <p className="text-xs text-gray-500">Ligar agora</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}

        {/* Website */}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{websiteDisplay}</p>
              <p className="text-xs text-gray-500">Visitar site</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {endereco && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco + (cidade ? `, ${cidade}` : ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">Como Chegar</span>
              <span className="sm:hidden">Ir</span>
            </a>
          )}
          
          {onViewProducts && productCount && productCount > 0 && (
            <button
              onClick={onViewProducts}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="hidden sm:inline">{productCount} Produtos</span>
              <span className="sm:hidden">{productCount}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

