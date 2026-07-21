import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const SITE_URL = "https://noticias.eullerlolato.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cripto News — O mercado cripto em 5 minutos",
    template: "%s | Cripto News",
  },
  description:
    "Newsletter diária gratuita sobre criptomoedas. Receba todo dia às 06h as principais notícias de Bitcoin, Ethereum e altcoins — sem ruído, sem hype. Feita para traders brasileiros.",
  keywords: [
    "newsletter cripto",
    "bitcoin newsletter",
    "criptomoedas notícias",
    "newsletter gratuita cripto",
    "bitcoin diário",
    "ethereum notícias",
    "mercado cripto brasil",
    "trader cripto",
    "altcoins notícias",
    "cripto news brasil",
  ],
  authors: [{ name: "Cripto News" }],
  creator: "Cripto News",
  publisher: "Cripto News",
  category: "Finance",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Cripto News",
    title: "Cripto News — O mercado cripto em 5 minutos",
    description:
      "Newsletter diária gratuita sobre criptomoedas. Todo dia às 06h, as notícias que importam para quem opera cripto.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cripto News — Newsletter diária de criptomoedas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cripto News — O mercado cripto em 5 minutos",
    description:
      "Newsletter diária gratuita sobre criptomoedas. Todo dia às 06h, as notícias que importam para quem opera cripto.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: { "pt-BR": "/", en: "/en" },
    types: { "application/rss+xml": `${SITE_URL}/rss.xml` },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-Z5SYK2MJLS" />
      </body>
    </html>
  );
}
