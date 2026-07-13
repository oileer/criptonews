import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 40,
          background: 'linear-gradient(135deg, #f0b429, #ff8a47)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="76" height="124" viewBox="0 0 256 417">
          <polygon fill="#ffffff" fillOpacity="0.92" points="127.9 0 125.1 9.5 125.1 285.1 127.9 287.9 255.9 212.3" />
          <polygon fill="#ffffff" fillOpacity="0.65" points="127.9 0 0 212.3 127.9 287.9 127.9 154.2" />
          <polygon fill="#ffffff" fillOpacity="0.85" points="127.9 312.2 126.3 314.1 126.3 412.3 127.9 416.9 256 236.6" />
          <polygon fill="#ffffff" fillOpacity="0.6" points="127.9 416.9 127.9 312.2 0 236.6" />
          <polygon fill="#ffffff" fillOpacity="0.45" points="127.9 287.9 255.9 212.3 127.9 154.2" />
          <polygon fill="#ffffff" fillOpacity="0.3" points="0 212.3 127.9 287.9 127.9 154.2" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
