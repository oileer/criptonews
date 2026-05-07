import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Impede clickjacking
        { key: 'X-Frame-Options', value: 'DENY' },
        // Impede sniffing de MIME type
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // Força HTTPS
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        // Referrer mínimo
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Permissões de browser APIs — só o necessário
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // CSP — só permite recursos do próprio domínio + Google Fonts + Resend
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://api.resend.com",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;
