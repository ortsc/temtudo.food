'use client'

import { useState, useCallback } from 'react'

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void
  imagePreview: string | null
}

export default function ImageUploader({ onImageSelect, imagePreview }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      onImageSelect(base64)
    }
    reader.readAsDataURL(file)
  }, [onImageSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  return (
    <div>
      <label className="label">Foto da Prateleira</label>
      
      {imagePreview ? (
        // Image preview
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 animate-fade-in">
          <img 
            src={imagePreview} 
            alt="Preview da prateleira" 
            className="w-full h-64 object-cover"
          />
          <button
            type="button"
            onClick={() => onImageSelect('')}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-error/90 text-white flex items-center justify-center hover:bg-error transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
            <span className="text-white text-sm font-medium">Imagem selecionada</span>
          </div>
        </div>
      ) : (
        // Upload zone
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-card-border hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-primary/20' : 'bg-primary/10'
            }`}>
              <svg 
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-primary' : 'text-primary/70'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div>
              <p className="font-semibold text-foreground">
                {isDragging ? 'Solte a imagem aqui' : 'Arraste uma foto ou clique para selecionar'}
              </p>
              <p className="text-sm text-muted mt-1">
                PNG, JPG ou WEBP até 10MB
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                Câmera
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-muted mt-3">
        💡 Dica: Fotografe com boa iluminação e certifique-se que os preços estão visíveis
      </p>
    </div>
  )
}

