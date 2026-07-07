import type { Metadata } from 'next'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import CtaFinal from '../components/CtaFinal'
import { dict } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Crypto News — the crypto market in 5 minutes',
  description:
    'Free daily crypto newsletter. Bitcoin, Ethereum and altcoin news with real-time prices and practical analysis for traders — every day at 6am, no noise, no hype.',
  keywords: [
    'crypto newsletter',
    'bitcoin newsletter',
    'daily crypto news',
    'free crypto newsletter',
    'bitcoin daily briefing',
    'ethereum news',
    'crypto market today',
    'crypto trader news',
  ],
  alternates: {
    canonical: '/en',
    languages: { 'pt-BR': '/', en: '/en' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/en',
    siteName: 'Crypto News',
    title: 'Crypto News — the crypto market in 5 minutes',
    description: 'Free daily crypto newsletter. The news that matters, every day at 6am.',
  },
}

export default function HomeEn() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav lang="en" />
      <Hero lang="en" />
      <HowItWorks lang="en" />
      <CtaFinal lang="en" />
      <footer style={{
        borderTop: '1px solid var(--card-border)',
        padding: '28px 24px',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-muted)',
        background: 'var(--bg)',
      }}>
        {dict.en.footer}
      </footer>
    </main>
  )
}
