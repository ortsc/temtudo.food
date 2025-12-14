'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Market {
  id_mercado: number
  nome_mercado: string
  bairro_mercado: string | null
  cidade_mercado: string | null
}

interface SearchData {
  id_pesquisa: number
  created_at: string
  tipo: string
  dados: Record<string, unknown>
}

interface Report {
  content: string
  generatedAt: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [markets, setMarkets] = useState<Market[]>([])
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([])
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [searches, setSearches] = useState<SearchData[]>([])
  const [loadingSearches, setLoadingSearches] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [activeTab, setActiveTab] = useState<'searches' | 'report' | 'chat'>('searches')

  // Chat states
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)

  // Search/Autocomplete states
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  // Fetch markets on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMarkets()
    }
  }, [isAuthenticated])

  // Fetch searches when market is selected
  useEffect(() => {
    if (selectedMarket) {
      fetchSearches(selectedMarket.id_mercado)
    }
  }, [selectedMarket])

  // Click outside handler for search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter markets when search query changes
  useEffect(() => {
    if (!markets.length) return
    const query = searchQuery.toLowerCase()
    const filtered = markets.filter(m =>
      m.nome_mercado.toLowerCase().includes(query) ||
      m.bairro_mercado?.toLowerCase().includes(query) ||
      m.cidade_mercado?.toLowerCase().includes(query)
    )
    setFilteredMarkets(filtered)
  }, [searchQuery, markets])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check - in production this would be more secure
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'temtudo2024'
    if (password === adminPassword) {
      setIsAuthenticated(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const fetchMarkets = async () => {
    try {
      const response = await fetch('/api/markets')
      const data = await response.json()
      if (data.success && data.markets) {
        const mappedMarkets = data.markets.map((m: Market & { avgPrice?: number }) => ({
          id_mercado: m.id_mercado,
          nome_mercado: m.nome_mercado,
          bairro_mercado: m.bairro_mercado,
          cidade_mercado: m.cidade_mercado,
        }))
        setMarkets(mappedMarkets)
        setFilteredMarkets(mappedMarkets)
      }
    } catch (err) {
      console.error('Error fetching markets:', err)
    }
  }

  const fetchSearches = async (marketId: number) => {
    setLoadingSearches(true)
    try {
      const response = await fetch(`/api/admin/searches?marketId=${marketId}`)
      const data = await response.json()
      if (data.success) {
        setSearches(data.searches || [])
      }
    } catch (err) {
      console.error('Error fetching searches:', err)
    } finally {
      setLoadingSearches(false)
    }
  }

  const generateReport = async () => {
    if (!selectedMarket) return

    setGeneratingReport(true)
    try {
      const response = await fetch('/api/admin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: selectedMarket.id_mercado }),
      })
      const data = await response.json()
      if (data.success) {
        setReport({
          content: data.report,
          generatedAt: new Date().toISOString(),
        })
        setActiveTab('report')
      }
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || !selectedMarket) return

    const newMessage: Message = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')
    setLoadingChat(true)

    try {
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket.id_mercado,
          messages: [...chatMessages, newMessage]
        }),
      })

      const data = await response.json()
      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setLoadingChat(false)
    }
  }

  const selectMarket = (market: Market) => {
    setSelectedMarket(market)
    setSearchQuery(market.nome_mercado)
    setIsSearchOpen(false)
    setSearchQuery(market.nome_mercado)
    setIsSearchOpen(false)
    setReport(null)
    setChatMessages([]) // Reset chat on market change
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mb-4 shadow-lg shadow-primary/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Área do Comerciante</h1>
              <p className="text-gray-600 mt-2">Acesse relatórios e dados do seu mercado</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Senha de Acesso</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-gray-900 ${passwordError ? 'border-red-500 ring-red-100' : 'border-gray-300'
                      }`}
                    placeholder="Digite a senha"
                  />
                  {passwordError && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1 ml-1 font-medium">Senha incorreta</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Acessar Painel
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para o início
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 block leading-tight">Temtudo</span>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">Business</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900">Administrador</p>
              <p className="text-xs text-gray-600 font-medium">Acesso Restrito</p>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-28">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Seu Mercado
              </h2>

              {/* Custom Autocomplete Input */}
              <div className="relative" ref={searchWrapperRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setIsSearchOpen(true)
                      if (!e.target.value) setSelectedMarket(null)
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Buscar mercado..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-gray-900 placeholder-gray-500 font-medium transition-all"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedMarket(null)
                        setIsSearchOpen(true)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {isSearchOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto animate-fade-in">
                    {filteredMarkets.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm font-medium">
                        Nenhum mercado encontrado
                      </div>
                    ) : (
                      filteredMarkets.map((market) => (
                        <button
                          key={market.id_mercado}
                          onClick={() => selectMarket(market)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-0 ${selectedMarket?.id_mercado === market.id_mercado ? 'bg-primary/5' : ''
                            }`}
                        >
                          <span className={`font-bold text-sm ${selectedMarket?.id_mercado === market.id_mercado ? 'text-primary' : 'text-gray-900'
                            }`}>
                            {market.nome_mercado}
                          </span>
                          <span className="text-xs text-gray-500">
                            {market.bairro_mercado || market.cidade_mercado}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedMarket && (
                <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in">
                  <h3 className="font-bold text-gray-900 text-lg">{selectedMarket.nome_mercado}</h3>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {selectedMarket.bairro_mercado && `${selectedMarket.bairro_mercado}, `}
                    {selectedMarket.cidade_mercado}
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={generateReport}
                      disabled={generatingReport}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {generatingReport ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Gerando Análise...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Gerar Relatório IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedMarket ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione um mercado</h3>
                <p className="text-gray-600 font-medium max-w-sm mx-auto">
                  Use a busca lateral para encontrar seu mercado e visualizar os dados.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('searches')}
                    className={`flex-1 py-4 px-6 text-sm font-bold transition-colors relative ${activeTab === 'searches'
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Pesquisas Recentes
                    </div>
                    {activeTab === 'searches' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-4 px-6 text-sm font-bold transition-colors relative ${activeTab === 'report'
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Relatório Inteligente
                      {report && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                    </div>
                    {activeTab === 'report' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-4 px-6 text-sm font-bold transition-colors relative ${activeTab === 'chat'
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Chat Business
                    </div>
                    {activeTab === 'chat' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 bg-gray-50/50">
                  {activeTab === 'searches' && (
                    <div className="h-full">
                      {loadingSearches ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                          <svg className="w-10 h-10 animate-spin mb-4 text-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="font-medium">Carregando dados...</span>
                        </div>
                      ) : searches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <p className="font-bold text-gray-700">Nenhuma pesquisa registrada</p>
                          <p className="text-sm mt-1">Dados aparecerão aqui quando usuários buscarem na sua região.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {searches.map((search) => (
                            <div
                              key={search.id_pesquisa}
                              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${search.tipo === 'product_search' ? 'bg-blue-50 text-blue-700' :
                                  search.tipo === 'cart_search' ? 'bg-green-50 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                  {search.tipo === 'product_search' ? 'BUSCA DE PRODUTO' :
                                    search.tipo === 'cart_search' ? 'OTIMIZAÇÃO DE CARRINHO' :
                                      search.tipo.toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {new Date(search.created_at).toLocaleString('pt-BR')}
                                </span>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 overflow-x-auto border border-gray-200 font-medium">
                                {JSON.stringify(search.dados, null, 2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'report' && (
                    <div className="h-full">
                      {report ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Relatório de Inteligência
                              </h3>
                              <p className="text-sm text-gray-600 font-medium mt-1">
                                Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const blob = new Blob([report.content], { type: 'text/plain' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `relatorio-${selectedMarket.nome_mercado.replace(/\s+/g, '-').toLowerCase()}.txt`
                                a.click()
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold transition-colors text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Exportar
                            </button>
                          </div>

                          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-primary">
                            <ReactMarkdown>{report.content}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                          <div className="w-20 h-20 bg-white rounded-full shadow-lg shadow-primary/5 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Relatório não gerado</h3>
                          <p className="text-gray-600 font-medium max-w-md mb-8">
                            Nossa IA analisa as tendências de busca e preços da região para sugerir oportunidades de negócio.
                          </p>
                          <button
                            onClick={generateReport}
                            disabled={generatingReport}
                            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Gerar Análise Agora
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'chat' && (
                    <div className="h-full flex flex-col h-[600px]">
                      {chatMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Assistente de Negócios</h3>
                          <p className="text-gray-600 font-medium max-w-sm mb-8">
                            Tire dúvidas sobre seus produtos, preços e tendências de mercado.
                          </p>
                          <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                            {['Devo comprar tomates?', 'Qual preço cobrar no tomate?', 'Quais produtos mais buscados?'].map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  setChatInput(q)
                                  // Small hack to trigger submit after state update
                                  setTimeout(() => document.getElementById('chat-submit')?.click(), 0)
                                }}
                                className="p-4 bg-white border border-gray-200 rounded-xl text-left text-sm font-medium hover:border-primary hover:text-primary transition-colors shadow-sm"
                              >
                                "{q}"
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {chatMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                                  }`}
                              >
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                          {loadingChat && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4 bg-white border-t border-gray-100">
                        <form onSubmit={handleSendMessage} className="relative">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Pergunte sobre seu negócio..."
                            className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium"
                          />
                          <button
                            id="chat-submit"
                            type="submit"
                            disabled={!chatInput.trim() || loadingChat}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
