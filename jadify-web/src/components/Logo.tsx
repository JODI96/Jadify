import { useId } from 'react'

interface LogoProps {
  size?: number
  wordmark?: boolean
  light?: boolean
}

export function Logo({ size = 32, wordmark = true, light = false }: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const gradId = `jg-${uid}`

  return (
    <span className="inline-flex items-center" style={{ gap: Math.round(size * 0.28) }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill={`url(#${gradId})`} />
        {/* Geometric J: straight stem + semicircular hook, centered in badge */}
        <path
          d="M 68,22 V 60 A 18,18 0 0 1 32,60"
          stroke="white"
          strokeWidth="17"
          strokeLinecap="round"
        />
      </svg>

      {wordmark && (
        <span
          style={{
            fontSize: Math.round(size * 0.56),
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: light ? '#ffffff' : '#111827',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1,
          }}
        >
          Jadify
        </span>
      )}
    </span>
  )
}
