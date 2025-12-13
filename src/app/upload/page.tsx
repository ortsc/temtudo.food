'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MarketSelector from '@/components/MarketSelector'
import ImageUploader from '@/components/ImageUploader'
import ProductReviewTable from '@/components/ProductReviewTable'
import { Mercado, ParsedProduct } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

type Step = 'upload' | 'analyzing' | 'review' | 'saving' | 'success'

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState<Step>('upload')
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
    setStep('analyzing')

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

      // Check if any products were found
      if (!data.products || data.products.length === 0) {
        setError('Nenhum produto com preço visível foi encontrado na imagem. Tente uma foto com etiquetas de preço mais claras.')
        setStep('upload')
        return
      }

      setProducts(data.products)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem')
      setStep('upload')
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
    setStep('saving')

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados')
      setStep('review')
    }
  }

  const handleReset = () => {
    setStep('upload')
    setSelectedMarket(null)
    setImageBase64(null)
    setProducts([])
    setError(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="w-full p-6 flex items-center justify-between border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold">Temtudo</span>
        </Link>

        <button
          onClick={handleLogout}
          className="btn btn-secondary text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-3">
            {[
              { key: 'upload', label: 'Upload', icon: '📷' },
              { key: 'review', label: 'Revisar', icon: '✏️' },
              { key: 'success', label: 'Salvo', icon: '✅' },
            ].map((s, i, arr) => (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === s.key || 
                  (step === 'analyzing' && s.key === 'upload') || 
                  (step === 'saving' && s.key === 'review')
                    ? 'bg-primary text-white'
                    : (step === 'success') || 
                      (step === 'review' && s.key === 'upload')
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card-border/50 text-muted'
                }`}>
                  <span>{s.icon}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    (step === 'review' && i === 0) || 
                    (step === 'saving' && i <= 1) ||
                    step === 'success'
                      ? 'bg-primary'
                      : 'bg-card-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            {step === 'upload' && 'Enviar Foto de Prateleira'}
            {step === 'analyzing' && 'Analisando Imagem...'}
            {step === 'review' && 'Revisar Produtos'}
            {step === 'saving' && 'Salvando...'}
            {step === 'success' && 'Dados Salvos!'}
          </h1>
          <p className="text-muted">
            {step === 'upload' && 'Selecione o mercado e envie uma foto da prateleira'}
            {step === 'analyzing' && 'Nossa IA está identificando produtos e preços'}
            {step === 'review' && 'Confira e corrija os dados antes de salvar'}
            {step === 'saving' && 'Aguarde enquanto salvamos os dados'}
            {step === 'success' && 'Obrigado por contribuir com a comunidade!'}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-fade-in flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Content based on step */}
        {(step === 'upload' || step === 'analyzing') && (
          <div className="card p-8 space-y-6 animate-fade-in">
            <MarketSelector 
              selectedMarket={selectedMarket}
              onSelect={setSelectedMarket}
            />

            <ImageUploader
              imagePreview={imageBase64}
              onImageSelect={setImageBase64}
            />

            <button
              onClick={handleAnalyze}
              disabled={!selectedMarket || !imageBase64 || step === 'analyzing'}
              className="btn btn-primary w-full py-4"
            >
              {step === 'analyzing' ? (
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analisando com IA...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Analisar com IA
                </span>
              )}
            </button>
          </div>
        )}

        {(step === 'review' || step === 'saving') && (
          <div className="space-y-6">
            {/* Selected market info */}
            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="font-semibold">{selectedMarket?.nome_mercado}</div>
                <div className="text-sm text-muted">
                  {selectedMarket?.cidade_mercado}, {selectedMarket?.estado_mercado}
                </div>
              </div>
            </div>

            {/* Products table */}
            <ProductReviewTable
              products={products}
              onUpdate={handleUpdateProduct}
              onRemove={handleRemoveProduct}
            />

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                disabled={step === 'saving'}
                className="btn btn-secondary flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={products.length === 0 || step === 'saving'}
                className="btn btn-primary flex-1"
              >
                {step === 'saving' ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar {products.length} {products.length === 1 ? 'Produto' : 'Produtos'}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Contribuição Registrada!</h2>
            <p className="text-muted mb-8">
              Seus dados foram salvos e ajudarão outras pessoas a encontrar preços justos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleReset} className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Enviar Mais Fotos
              </button>
              <Link href="/" className="btn btn-secondary">
                Voltar para Início
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
