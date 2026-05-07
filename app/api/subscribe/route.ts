import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID!

// Rate limit simples em memória — por IP, máx 3 tentativas por hora
const attempts = new Map<string, { count: number; ts: number }>()
const LIMIT = 3
const WINDOW = 60 * 60 * 1000 // 1 hora

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now - entry.ts > WINDOW) {
    attempts.set(ip, { count: 1, ts: now })
    return false
  }
  if (entry.count >= LIMIT) return true
  entry.count++
  return false
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente mais tarde.' }, { status: 429 })
  }

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  if (!RESEND_API_KEY || !AUDIENCE_ID) {
    console.error('Env vars ausentes')
    return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })
  }

  const res = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Erro ao cadastrar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Bloqueia GET, PUT, DELETE nessa rota
export async function GET() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 })
}
