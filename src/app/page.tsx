import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

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
    <main className="min-h-screen flex flex-col font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="w-full p-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md fixed top-0 z-50 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Temtudo</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/app" className="text-sm font-medium text-muted hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar Preços
          </Link>
          <Link href="/admin" className="text-sm font-medium text-muted hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Painel de Dados
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-40 pb-20 relative overflow-hidden min-h-[90vh]">
        {/* Abstract Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-[#050505]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-40"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/5 blur-[100px] rounded-full opacity-30"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="max-w-4xl animate-fade-in relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted text-xs font-mono mb-8 uppercase tracking-wider backdrop-blur-sm">
            <span>Ecossistema de Dados do Varejo</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight">
            Seu supermercado
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              inteligente no bolso
            </span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            Economize em cada compra e ajude a comunidade. Use nossa IA para ler preços de prateleiras automaticamente apenas tirando uma foto.
          </p>

          <Link href="/app" className="group relative inline-flex items-center justify-center btn btn-primary text-xl px-12 py-6 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all duration-300">
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity blur-lg -z-10"></span>
            <div className="flex flex-col items-center">
              <span className="font-bold tracking-wide">ABRIR APP</span>
              <span className="text-xs font-normal opacity-80 mt-1">Busque preços e colabore</span>
            </div>
            <svg className="w-8 h-8 ml-4 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </Link>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto border-t border-white/10 pt-12 mt-16 w-full">
            <div>
              <div className="text-3xl font-bold text-white font-mono">{produtosCount.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-1">Produtos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white font-mono">{mercadosCount.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-1">Mercados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white font-mono">{contribuidoresCount.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-1">Colaboradores</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success font-mono">+15%</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-1">Economia Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Intelligence Section */}
      <section className="py-32 px-6 relative overflow-hidden bg-black">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full opacity-20 pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center">

            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-accent opacity-20 blur-2xl rounded-[32px]" />
              <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                {/* Abstract UI representation of Business Data */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </div>
                      <span className="font-bold text-white">Análise de Competitividade</span>
                    </div>
                    <span className="text-success text-sm font-mono">+24% vs Média</span>
                  </div>

                  <div className="h-48 w-full relative">
                    {/* Simplified Graph */}
                    <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                      {/* Grid */}
                      <path stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" d="M0 40 H100 M0 30 H100 M0 20 H100 M0 10 H100" />
                      {/* Line 1 (Market) */}
                      <path fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" d="M0 35 Q 20 38, 40 30 T 100 25" />
                      {/* Line 2 (User) */}
                      <path fill="none" stroke="var(--primary)" strokeWidth="2" d="M0 45 Q 20 40, 40 20 T 100 10" />
                      {/* Area under user line */}
                      <path fill="url(#gradient)" opacity="0.2" d="M0 45 Q 20 40, 40 20 T 100 10 V 50 H 0 Z" />
                      <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Tooltip Mockup */}
                    <div className="absolute top-1/4 right-1/4 bg-gray-900 border border-gray-700 px-3 py-2 rounded shadow-xl">
                      <div className="text-xs text-muted">Preço Sugerido</div>
                      <div className="text-sm font-bold text-white">R$ 12,90</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-xs text-muted mb-1">Buscas na Região</div>
                      <div className="text-xl font-bold text-white font-mono">1.284</div>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="text-xs text-primary mb-1">Oportunidades</div>
                      <div className="text-xl font-bold text-white font-mono">42</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-mono text-accent border border-accent/20 rounded-full bg-accent/5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                TEMTUDO BUSINESS
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Dados que nivelam o jogo.
              </h2>
              <div className="space-y-6 text-lg text-muted">
                <p>
                  As grandes redes sempre tiveram acesso a dados privilegiados.
                  <span className="text-white font-medium"> A Temtudo democratiza essa inteligência.</span>
                </p>
                <p>
                  Nossa plataforma processa milhares de pontos de dados diariamente para entregar insights acionáveis. Entenda o comportamento de busca do seu bairro e otimize suas margens com precisão cirúrgica.
                </p>

                <Link href="/admin" className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-bold mt-4 group">
                  Acessar Painel Business
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-white">T</div>
              <span className="font-bold text-white">Temtudo Data Inc.</span>
            </div>
            <p className="text-xs text-muted max-w-xs">
              Conectando a cadeia de suprimentos alimentar do Brasil.
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted">
            <Link href="/terms" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="mailto:contato@temtudo.com" className="hover:text-white transition-colors">Contato</Link>
          </div>

          <div className="text-xs text-muted">
            © 2024 Temtudo Data.
          </div>
        </div>
      </footer>
    </main>
  )
}
