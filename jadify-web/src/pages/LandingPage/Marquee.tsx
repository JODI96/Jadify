const ITEMS = [
  'Stripe Zahlungen', 'TWINT', 'Apple Pay', 'Google Pay',
  'Schweizer Hosting', 'DSGVO-konform', 'Keine Verträge', '500+ Salons',
  'Automatische E-Mails', 'CHF 0 Startkosten', 'Sofort startklar', '99.9% Uptime',
]

export function Marquee() {
  const triple = [...ITEMS, ...ITEMS, ...ITEMS]

  return (
    <div className="relative overflow-hidden bg-gray-950 border-y border-white/[0.05] py-3.5">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-950 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-950 to-transparent z-10" />

      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'marquee 35s linear infinite' }}
      >
        {triple.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-5 px-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">
              {item}
            </span>
            <span className="text-green-500/60 text-[8px]">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
