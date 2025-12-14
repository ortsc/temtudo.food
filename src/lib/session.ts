'use client'

const SESSION_KEY = 'temtudo_session_id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem(SESSION_KEY)
  
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  
  return sessionId
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

export async function initSession(): Promise<string> {
  const sessionId = getOrCreateSessionId()
  
  // Register session on server
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'init_session',
        sessionId,
      }),
    })
  } catch (e) {
    console.error('Failed to init session:', e)
  }
  
  return sessionId
}

export async function trackEvent(
  tipo: 'product_search' | 'cart_search' | 'market_view' | 'cart_optimize',
  dados: Record<string, unknown>
): Promise<void> {
  const sessionId = getSessionId()
  if (!sessionId) return
  
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_event',
        sessionId,
        tipo,
        dados,
      }),
    })
  } catch (e) {
    console.error('Failed to track event:', e)
  }
}

