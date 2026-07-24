// Auth compartilhada com o Google Cloud via service account (JWT bearer) —
// reaproveita a mesma FIREBASE_ADMIN_KEY já usada pro Firebase Admin, sem
// precisar de credencial nova. Usado pelo Text-to-Speech.
import crypto from 'node:crypto'

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const cacheTokens = new Map() // scope → { token, exp }

export async function tokenServiceAccount(scope) {
  const emCache = cacheTokens.get(scope)
  if (emCache && Date.now() < emCache.exp - 60_000) return emCache.token

  const sa = JSON.parse(process.env.FIREBASE_ADMIN_KEY)
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claims = { iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(sa.private_key).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const jwt = `${unsigned}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`token exchange (service account) falhou: ${JSON.stringify(json)}`)

  cacheTokens.set(scope, { token: json.access_token, exp: Date.now() + json.expires_in * 1000 })
  return json.access_token
}

// Auth de usuário via refresh token (YouTube — precisa ser autorização de
// usuário real, service account não pode subir vídeo num canal pessoal).
export async function tokenUsuario({ clientId, clientSecret, refreshToken }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`refresh token falhou: ${JSON.stringify(json)}`)
  return json.access_token
}
