import Nav from './components/Nav'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import PartnerCta from './components/PartnerCta'
import CtaFinal from './components/CtaFinal'
import Termometro from './components/Termometro'
import EdicaoDeHoje from './components/EdicaoDeHoje'
import { listarEdicoes } from '@/lib/edicoes'

export default function Home() {
  const edicoesCount = listarEdicoes('pt').length

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <Hero edicoesCount={edicoesCount} />
      <div style={{ padding: '0 24px 40px' }}>
        <Termometro />
      </div>
      <EdicaoDeHoje />
      <HowItWorks />
      <PartnerCta />
      <CtaFinal />
      <footer style={{
        borderTop: '1px solid var(--card-border)',
        padding: '28px 24px',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-muted)',
        background: 'var(--bg)',
      }}>
        © 2026 Cripto News · feito para traders
      </footer>
    </main>
  )
}
