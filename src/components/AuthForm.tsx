'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import AddressAutocomplete, { AddressDetails } from './AddressAutocomplete'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleAddressChange = useCallback((address: string, details?: AddressDetails) => {
    setEndereco(address)
    if (details) {
      setCidade(details.city)
      setEstado(details.state)
      setCep(details.cep)
      if (details.lat) setLatitude(details.lat)
      if (details.lng) setLongitude(details.lng)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: nome,
            },
            emailRedirectTo: `${siteUrl}/login`,
          },
        })
        
        if (error) throw error

        // Create user in Usuarios table with enhanced fields
        if (data.user) {
          await supabase.from('Usuarios').insert({
            email_usuario: email,
            nome_usuario: nome,
            data_nascimento: dataNascimento || null,
            endereco: endereco || null,
            cidade: cidade || null,
            estado: estado || null,
            cep: cep || null,
            latitude: latitude,
            longitude: longitude,
          })
        }
        
        setMessage('Verifique seu email para confirmar o cadastro!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        router.push('/app')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {mode === 'signup' && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          onLoad={() => setMapsLoaded(true)}
        />
      )}
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar conta'}
            </h1>
            <p className="text-muted mt-2">
              {mode === 'login' 
                ? 'Entre para contribuir com preços' 
                : 'Junte-se à comunidade Temtudo'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="animate-fade-in">
                  <label htmlFor="nome" className="label">Nome *</label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="input"
                    required
                  />
                </div>

                <div className="animate-fade-in">
                  <label htmlFor="dataNascimento" className="label">Data de Nascimento</label>
                  <input
                    id="dataNascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="animate-fade-in">
                  <label htmlFor="endereco" className="label">Endereço</label>
                  {mapsLoaded ? (
                    <AddressAutocomplete
                      value={endereco}
                      onChange={handleAddressChange}
                      placeholder="Digite seu endereço"
                      className="input"
                    />
                  ) : (
                    <input
                      id="endereco"
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Digite seu endereço"
                      className="input"
                    />
                  )}
                  {cidade && estado && (
                    <p className="text-xs text-gray-500 mt-1">
                      {cidade}, {estado} {cep && `- ${cep}`}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="label">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Senha *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm animate-fade-in">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processando...
                </span>
              ) : (
                mode === 'login' ? 'Entrar' : 'Criar conta'
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? (
              <>
                Não tem uma conta?{' '}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
