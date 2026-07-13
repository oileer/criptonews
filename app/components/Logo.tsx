export function Diamante({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.63} viewBox="0 0 256 417" style={{ display: 'block' }}>
      <polygon fill="#ffffff" fillOpacity=".92" points="127.9 0 125.1 9.5 125.1 285.1 127.9 287.9 255.9 212.3" />
      <polygon fill="#ffffff" fillOpacity=".65" points="127.9 0 0 212.3 127.9 287.9 127.9 154.2" />
      <polygon fill="#ffffff" fillOpacity=".85" points="127.9 312.2 126.3 314.1 126.3 412.3 127.9 416.9 256 236.6" />
      <polygon fill="#ffffff" fillOpacity=".6" points="127.9 416.9 127.9 312.2 0 236.6" />
      <polygon fill="#ffffff" fillOpacity=".45" points="127.9 287.9 255.9 212.3 127.9 154.2" />
      <polygon fill="#ffffff" fillOpacity=".3" points="0 212.3 127.9 287.9 127.9 154.2" />
    </svg>
  )
}

/** Badge quadrado com degradê dourado/laranja + losango — identidade compartilhada entre os produtos. */
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        flexShrink: 0,
        background: 'linear-gradient(135deg, var(--gold), var(--orange))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(240,180,41,.35)',
      }}
    >
      <Diamante size={size * 0.42} />
    </div>
  )
}
