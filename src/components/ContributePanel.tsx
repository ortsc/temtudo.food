'use client'

import { useState } from 'react'
import MarketSelector from '@/components/MarketSelector'
import ImageUploader from '@/components/ImageUploader'
import { Mercado, ParsedProduct } from '@/lib/types'

type Step = 'upload' | 'review' | 'success'

interface ContributePanelProps {
  onSuccess?: () => void
}

export default function ContributePanel({ onSuccess }: ContributePanelProps) {
  const [step, setStep] = useState<Step>('upload')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<Mercado | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [products, setProducts] = useState<ParsedProduct[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!selectedMarket || !imageBase64) {
      setError('Selecione um mercado e uma imagem')
      return
    }

    setError(null)
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/parse-shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao analisar imagem')
      }

      if (!data.products || data.products.length === 0) {
        setError('Nenhum produto com preço visível foi encontrado. Tente uma foto mais clara.')
        return
      }

      setProducts(data.products)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUpdateProduct = (index: number, field: keyof ParsedProduct, value: string | number | null) => {
    setProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ))
  }

  const handleRemoveProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (products.length === 0) {
      setError('Nenhum produto para salvar')
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket?.id_mercado,
          products,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar produtos')
      }

      setStep('success')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setSelectedMarket(null)
    setImageBase64(null)
    setProducts([])
    setError(null)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with Steps */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Contribuir Preços</h2>
          {step === 'review' && (
            <button 
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              Cancelar
            </button>
          )}
        </div>
        
        {/* Simplified Progress Bar */}
        <div className="flex items-center gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${
            step === 'upload' || step === 'review' || step === 'success' ? 'bg-primary' : 'bg-gray-200'
          }`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${
            step === 'review' || step === 'success' ? 'bg-primary' : 'bg-gray-200'
          }`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${
            step === 'success' ? 'bg-primary' : 'bg-gray-200'
          }`} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span className={step === 'upload' ? 'text-primary font-medium' : ''}>Foto</span>
          <span className={step === 'review' ? 'text-primary font-medium' : ''}>Revisão</span>
          <span className={step === 'success' ? 'text-primary font-medium' : ''}>Concluído</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <MarketSelector 
                selectedMarket={selectedMarket}
                onSelect={setSelectedMarket}
              />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <ImageUploader
                imagePreview={imageBase64}
                onImageSelect={setImageBase64}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedMarket || !imageBase64 || isAnalyzing}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analisando Imagem...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Processar Foto
                </>
              )}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{selectedMarket?.nome_mercado}</p>
                <p className="text-xs text-gray-500 truncate">{products.length} produtos identificados</p>
              </div>
            </div>

            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 font-medium uppercase mb-1 block">Produto</label>
                      <input
                        type="text"
                        value={product.nome}
                        onChange={(e) => handleUpdateProduct(index, 'nome', e.target.value)}
                        className="w-full text-sm font-medium text-gray-900 border-b border-transparent focus:border-primary focus:outline-none bg-transparent placeholder-gray-300"
                        placeholder="Nome do produto"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(index)}
                      className="ml-2 text-gray-300 hover:text-red-500 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase mb-1 block">Marca</label>
                      <input
                        type="text"
                        value={product.marca || ''}
                        onChange={(e) => handleUpdateProduct(index, 'marca', e.target.value)}
                        className="w-full text-sm text-gray-600 border-b border-gray-100 focus:border-primary focus:outline-none bg-transparent placeholder-gray-300"
                        placeholder="Marca (opcional)"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase mb-1 block">Preço (R$)</label>
                      <div className="relative">
                        <span className="absolute left-0 top-0 text-sm text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={product.preco}
                          onChange={(e) => handleUpdateProduct(index, 'preco', parseFloat(e.target.value))}
                          className="w-full pl-6 text-sm font-bold text-primary border-b border-gray-100 focus:border-primary focus:outline-none bg-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2">
              <button
                onClick={handleSave}
                disabled={products.length === 0 || isSaving}
                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar e Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sucesso!</h3>
            <p className="text-gray-500 mb-8 max-w-xs">
              Preços atualizados. Obrigado por ajudar a comunidade a economizar!
            </p>

            <button 
              onClick={handleReset} 
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              Enviar Mais
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
