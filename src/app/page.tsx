import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats from database
  const [produtosResult, mercadosResult, usuariosResult] = await Promise.all([
    supabase.from('Produtos').select('*', { count: 'exact', head: true }),
    supabase.from('Mercados').select('*', { count: 'exact', head: true }),
    supabase.from('Usuarios').select('*', { count: 'exact', head: true }),
  ])

  const produtosCount = produtosResult.count || 0
  const mercadosCount = mercadosResult.count || 0
  const contribuidoresCount = usuariosResult.count || 0

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold">Temtudo</span>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/app?tab=contribuir" className="btn btn-secondary">
                Contribuir Preços
              </Link>
              <Link href="/app" className="btn btn-primary">
                Abrir App
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary">
                Entrar
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="max-w-4xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Mapeando preços em tempo real
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Alimentos saudáveis
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              a preços justos
            </span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
            Colabore com a comunidade enviando fotos de prateleiras. 
            Nossa IA extrai automaticamente produtos e preços para mapear 
            os melhores lugares para comprar no Brasil.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app" className="btn btn-primary text-lg px-8 py-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Comparar Preços
            </Link>
            <Link href={user ? "/app?tab=contribuir" : "/signup"} className="btn btn-secondary text-lg px-8 py-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Contribuir Preços
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 animate-fade-in delay-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{produtosCount}</div>
            <div className="text-sm text-muted mt-1">Produtos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{mercadosCount}</div>
            <div className="text-sm text-muted mt-1">Mercados</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{contribuidoresCount}</div>
            <div className="text-sm text-muted mt-1">Contribuidores</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-6 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Tire uma foto</h3>
              <p className="text-muted text-sm">
                Fotografe a prateleira do supermercado com produtos e preços visíveis
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 text-center animate-fade-in delay-100">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">IA processa</h3>
              <p className="text-muted text-sm">
                Nossa inteligência artificial identifica produtos, marcas e preços automaticamente
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 text-center animate-fade-in delay-200">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Compare preços</h3>
              <p className="text-muted text-sm">
                Encontre onde comprar mais barato na sua região
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-card-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted text-sm">
            <span>© 2024 Temtudo</span>
            <span>•</span>
            <span>Palantir for Food</span>
          </div>
          <div className="flex items-center gap-4 text-muted text-sm">
            <Link href="/admin" className="hover:text-primary transition-colors">
              Área do Comerciante
            </Link>
            <span>•</span>
            <span>Democratizando o acesso a alimentos saudáveis no Brasil</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
