'use client'

import { ParsedProduct } from '@/lib/types'

interface ProductReviewTableProps {
  products: ParsedProduct[]
  onUpdate: (index: number, field: keyof ParsedProduct, value: string | number | null) => void
  onRemove: (index: number) => void
}

export default function ProductReviewTable({ products, onUpdate, onRemove }: ProductReviewTableProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Produtos Encontrados</h3>
        <span className="text-sm text-muted bg-primary/10 px-3 py-1 rounded-full">
          {products.length} {products.length === 1 ? 'produto' : 'produtos'}
        </span>
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 p-4 bg-primary/5 border-b border-card-border text-sm font-semibold text-muted">
          <div className="col-span-3">Produto</div>
          <div className="col-span-3">Marca</div>
          <div className="col-span-3">Categoria</div>
          <div className="col-span-2">Preço</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-card-border">
          {products.map((product, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-primary/5 transition-colors">
              {/* Nome */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={product.nome}
                  onChange={(e) => onUpdate(index, 'nome', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:border-primary bg-transparent"
                  placeholder="Nome do produto"
                />
              </div>

              {/* Marca */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={product.marca || ''}
                  onChange={(e) => onUpdate(index, 'marca', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:border-primary bg-transparent"
                  placeholder="Marca"
                />
              </div>

              {/* Categoria */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={product.categoria || ''}
                  onChange={(e) => onUpdate(index, 'categoria', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:border-primary bg-transparent"
                  placeholder="Categoria"
                />
              </div>

              {/* Preço */}
              <div className="col-span-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.preco}
                    onChange={(e) => onUpdate(index, 'preco', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:border-primary bg-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Remove button */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-error hover:bg-error/10 transition-colors"
                  title="Remover produto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-4 card bg-primary/5 flex items-center justify-between">
        <span className="text-muted">Total estimado:</span>
        <span className="text-2xl font-bold text-primary">
          R$ {products.reduce((sum, p) => sum + (p.preco || 0), 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}

