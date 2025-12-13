import AuthForm from '@/components/AuthForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Back to home */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted hover:text-primary transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </Link>

      <AuthForm mode="signup" />
    </main>
  )
}

