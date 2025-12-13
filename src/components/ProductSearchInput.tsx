'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id_produto: number
  nome_produto: string | null
  marca_produto: string | null
  categoria: string | null
}

interface ProductSearchInputProps {
  onSelect: (product: Product) => void
  selectedProduct: Product | null
}

export default function ProductSearchInput({ onSelect, selectedProduct }: ProductSearchInputProps) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setProducts([])
        return
      }

      setLoading(true)
      
      const { data, error } = await supabase
        .from('Produtos')
        .select('id_produto, nome_produto, marca_produto, categoria')
        .or(`nome_produto.ilike.%${query}%,marca_produto.ilike.%${query}%`)
        .limit(8)

      if (!error && data) {
        setProducts(data)
      }
      setLoading(false)
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [query, supabase])

  const handleSelect = (product: Product) => {
    onSelect(product)
    setQuery('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null as unknown as Product)
    setQuery('')
    inputRef.current?.focus()
  }

  if (selectedProduct) {
    return (
      <div className="relative">
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{selectedProduct.nome_produto}</div>
            {selectedProduct.marca_produto && (
              <div className="text-sm text-gray-500">{selectedProduct.marca_produto}</div>
            )}
          </div>
          <button
            onClick={handleClear}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <svg 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar produto... (ex: Leite, Arroz)"
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && products.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {products.map((product) => (
            <button
              key={product.id_produto}
              onClick={() => handleSelect(product)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">{product.nome_produto}</div>
                <div className="text-xs text-gray-500">
                  {[product.marca_produto, product.categoria].filter(Boolean).join(' • ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

