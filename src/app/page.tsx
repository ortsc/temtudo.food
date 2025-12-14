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
    <main className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="w-full p-6 flex items-center justify-between border-b border-white/5 backdrop-blur-sm fixed top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Temtudo<span className="text-primary">.data</span></span>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/admin" className="btn btn-secondary text-sm">
                Painel de Dados
              </Link>
              <Link href="/app" className="btn btn-primary text-sm shadow-lg shadow-primary/20">
                Acessar Plataforma
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary text-sm hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary text-sm shadow-lg shadow-primary/20">
                Começar Agora
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-50" />
        </div>

        <div className="max-w-5xl animate-fade-in relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-8 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Price Intelligence Engine 2.0
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight">
            Dados removem
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-primary-dark">
              ineficiências nos preços
            </span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            Somos uma <span className="text-white font-medium">empresa de dados</span> que democratiza o acesso à inteligência de mercado.
            Nossa tecnologia permite que o pequeno varejista compita de igual para igual com os gigantes do setor.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app" className="group relative btn btn-primary text-lg px-8 py-4 overflow-hidden rounded-xl shadow-xl shadow-primary/20">
              <span className="relative z-10 flex items-center">
                Ver Dados em Tempo Real
                <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link href={user ? "/admin" : "/signup"} className="btn btn-secondary text-lg px-8 py-4 rounded-xl hover:bg-white/5 border border-white/10">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Conhecer Planos de Dados
              </span>
            </Link>
          </div>
        </div>

        {/* Live Data Strip */}
        <div className="w-full max-w-6xl mt-24 border-y border-white/5 bg-black/20 backdrop-blur-md">
          <div className="grid grid-cols-3 divide-x divide-white/5">
            <div className="p-6">
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Datapoints Coletados</div>
              <div className="text-3xl font-bold font-mono text-white">{produtosCount.toLocaleString('pt-BR')}</div>
            </div>
            <div className="p-6">
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Fontes Monitoradas</div>
              <div className="text-3xl font-bold font-mono text-white">{mercadosCount.toLocaleString('pt-BR')}</div>
            </div>
            <div className="p-6">
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Analistas Ativos</div>
              <div className="text-3xl font-bold font-mono text-white">{contribuidoresCount.toLocaleString('pt-BR')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: The problem & Solution */}
      <section className="py-24 px-6 bg-black/20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 mb-4 text-xs font-mono text-accent border border-accent/20 rounded-full bg-accent/5">
                NÍVELANDO O JOGO
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                O pequeno agora compete com o gigante.
              </h2>
              <div className="space-y-6 text-lg text-muted">
                <p>
                  As grandes redes de varejo sempre tiveram acesso a dados privilegiados. Isso gerava uma assimetria injusta que esmagava o pequeno comerciante.
                </p>
                <p>
                  <strong className="text-white">A Temtudo mudou as regras.</strong>
                </p>
                <p>
                  Nossos algoritmos analisam milhares de preços em tempo real, permitindo que mercearias, hortifrutis e pequenos mercados otimizem suas margens e ofereçam preços agressivos onde realmente importa.
                </p>
                <div className="pt-4">
                  <Link href="/cases" className="text-primary hover:text-primary-light font-medium inline-flex items-center">
                    Ler estudos de caso
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-accent opacity-20 blur-2xl rounded-[32px]" />
              <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl">
                {/* Abstract UI representation of data vs price */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted mb-6">
                    <span>Performance de Preço</span>
                    <span className="text-success">+15% Margem</span>
                  </div>
                  <div className="h-64 w-full bg-gradient-to-b from-primary/10 to-transparent rounded-lg border border-primary/20 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-primary/20 transform skew-y-6 origin-bottom-left" />
                    <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-accent/20 transform -skew-y-3 origin-bottom-right" />
                    {/* Grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-muted mb-1">Preço Médio</div>
                      <div className="text-lg font-mono text-white">R$ 14,50</div>
                    </div>
                    <div className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="text-xs text-primary mb-1">Preço Otimizado</div>
                      <div className="text-lg font-mono text-white">R$ 12,90</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-white">T</div>
              <span className="font-bold text-white">Temtudo Data Inc.</span>
            </div>
            <p className="text-xs text-muted max-w-xs">
              Transformando dados brutos em competitividade para o varejo brasileiro.
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted">
            <Link href="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Portal Corporativo</Link>
          </div>

          <div className="text-xs text-muted">
            © 2024 Temtudo Data. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  )
}
