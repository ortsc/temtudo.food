'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mercado } from '@/lib/types'

interface MarketSelectorProps {
  selectedMarket: Mercado | null
  onSelect: (market: Mercado | null) => void
}

export default function MarketSelector({ selectedMarket, onSelect }: MarketSelectorProps) {
  const [markets, setMarkets] = useState<Mercado[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchMarkets() {
      try {
        console.log('Fetching markets...')
        const { data, error } = await supabase
          .from('Mercados')
          .select('*')
          .order('nome_mercado')
        
        console.log('Markets response:', { data, error })
        
        if (error) {
          console.error('Error fetching markets:', error)
          setError(error.message)
        } else if (data) {
          setMarkets(data)
        }
      } catch (err) {
        console.error('Exception fetching markets:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMarkets()
  }, [supabase])

  const filteredMarkets = markets.filter(m => 
    m.nome_mercado?.toLowerCase().includes(search.toLowerCase()) ||
    m.cidade_mercado?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <label className="label">Mercado</label>
      
      {/* Selected market display / dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input w-full flex items-center justify-between text-left"
      >
        {loading ? (
          <span className="text-muted-light">Carregando mercados...</span>
        ) : error ? (
          <span className="text-error">Erro: {error}</span>
        ) : selectedMarket ? (
          <span>
            <span className="font-medium">{selectedMarket.nome_mercado}</span>
            {selectedMarket.cidade_mercado && (
              <span className="text-muted ml-2">- {selectedMarket.cidade_mercado}, {selectedMarket.estado_mercado}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-light">Selecione um mercado ({markets.length} disponíveis)</span>
        )}
        <svg 
          className={`w-5 h-5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 card shadow-lg max-h-80 overflow-hidden animate-fade-in">
          {/* Search input */}
          <div className="p-3 border-b border-card-border">
            <input
              type="text"
              placeholder="Buscar mercado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2"
              autoFocus
            />
          </div>

          {/* Market list */}
          <div className="max-h-56 overflow-y-auto">
            {filteredMarkets.length === 0 ? (
              <div className="p-4 text-center text-muted">
                {markets.length === 0 ? 'Nenhum mercado cadastrado' : 'Nenhum mercado encontrado'}
              </div>
            ) : (
              filteredMarkets.map((market) => (
                <button
                  key={market.id_mercado}
                  type="button"
                  onClick={() => {
                    onSelect(market)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-3 ${
                    selectedMarket?.id_mercado === market.id_mercado ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{market.nome_mercado || 'Sem nome'}</div>
                    {market.cidade_mercado && (
                      <div className="text-sm text-muted">
                        {market.cidade_mercado}, {market.estado_mercado}
                      </div>
                    )}
                  </div>
                  {selectedMarket?.id_mercado === market.id_mercado && (
                    <svg className="w-5 h-5 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false)
            setSearch('')
          }}
        />
      )}
    </div>
  )
}
