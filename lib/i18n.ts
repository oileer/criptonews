export type Lang = 'pt' | 'en'

export const dict = {
  pt: {
    // Nav
    navEditions: 'edições',
    navHow: 'como funciona',
    navCta: 'inscreva-se',
    navHowHref: '/#como-funciona',
    editionsHref: '/edicoes',
    homeHref: '/',
    // Hero
    badge: 'newsletter · cripto · todo dia às 06h',
    headline1: 'o mercado cripto',
    headline2: 'em 5 minutos.',
    sub: 'as principais notícias do mercado cripto, diariamente no seu email.',
    subStrong: 'totalmente grátis.',
    placeholder: 'coloque seu email',
    button: 'inscreva-se',
    buttonLoading: 'enviando...',
    done: '✓ você está na lista. até amanhã às 06h!',
    error: 'erro ao cadastrar. tente novamente.',
    socialProof: (n: number) => `edições publicadas · sempre às 06h`,
    socialProofStrong: (n: number) => `${n}`,
    // HowItWorks
    howEyebrow: 'como funciona',
    howTitle1: 'você mais atualizado',
    howTitle2: 'em 5 minutos',
    steps: [
      { num: '1.', title: 'se inscreva', desc: 'coloque seu email e clique no botão para se inscrever gratuitamente', gif: '/gifs/email.gif' },
      { num: '2.', title: 'prepare um café', desc: 'todo dia às 06h, a edição chega no seu email. abre, lê em 5 minutos e já sabe onde o mercado dormiu', gif: '/gifs/cafe.gif' },
      { num: '3.', title: 'opere com vantagem', desc: 'com o contexto certo, você entra no dia com clareza — sem ficar atrás do mercado', gif: '/gifs/chart.gif' },
    ],
    // CtaFinal
    ctaEyebrow: 'comece agora',
    ctaTitle1: 'próxima edição:',
    ctaTitle2: 'amanhã às 06h.',
    ctaSub: 'junte-se a traders que já começam o dia informados — sem abrir twitter, sem grupo de whatsapp.',
    ctaFoot: 'gratuito · sem spam · cancele quando quiser',
    // Footer
    footer: '© 2026 Cripto News · feito para traders',
  },
  en: {
    navEditions: 'editions',
    navHow: 'how it works',
    navCta: 'subscribe',
    navHowHref: '/en#como-funciona',
    editionsHref: '/en/editions',
    homeHref: '/en',
    badge: 'newsletter · crypto · every day at 6am',
    headline1: 'the crypto market',
    headline2: 'in 5 minutes.',
    sub: 'the crypto news that matters, delivered to your inbox daily.',
    subStrong: 'completely free.',
    placeholder: 'enter your email',
    button: 'subscribe',
    buttonLoading: 'sending...',
    done: "✓ you're on the list. see you tomorrow at 6am!",
    error: 'something went wrong. please try again.',
    socialProof: (n: number) => `editions published · every day at 6am`,
    socialProofStrong: (n: number) => `${n}`,
    howEyebrow: 'how it works',
    howTitle1: 'get up to speed',
    howTitle2: 'in 5 minutes',
    steps: [
      { num: '1.', title: 'subscribe', desc: 'drop your email and click the button — it is free', gif: '/gifs/email.gif' },
      { num: '2.', title: 'brew a coffee', desc: 'every day at 6am the edition lands in your inbox. read it in 5 minutes and know where the market slept', gif: '/gifs/cafe.gif' },
      { num: '3.', title: 'trade with an edge', desc: 'with the right context you start the day with clarity — never behind the market', gif: '/gifs/chart.gif' },
    ],
    ctaEyebrow: 'start now',
    ctaTitle1: 'next edition:',
    ctaTitle2: 'tomorrow at 6am.',
    ctaSub: 'join traders who start the day informed — no twitter doomscrolling, no whatsapp groups.',
    ctaFoot: 'free · no spam · unsubscribe anytime',
    footer: '© 2026 Crypto News · made for traders',
  },
} as const

export type Dict = (typeof dict)['pt']
