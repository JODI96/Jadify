import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi, type SubscriptionResponse } from '../../api'
import { useAuth } from '../../store/authStore'

interface TierInfo {
  name: string
  price: string
  fee: string
  features: string[]
  highlight?: boolean
}

const TIERS: TierInfo[] = [
  {
    name: 'Free',
    price: 'CHF 0/Monat',
    fee: '2% pro Buchung',
    features: ['Unbegrenzte Buchungen', 'Kunden-E-Mails', 'Öffentliche Buchungsseite'],
  },
  {
    name: 'Growth',
    price: 'CHF 29/Monat',
    fee: '0.5% pro Buchung',
    features: ['Alles in Free', 'Logo hochladen', 'Priority-Support'],
    highlight: true,
  },
  {
    name: 'Pro',
    price: 'CHF 79/Monat',
    fee: '0% Plattformgebühr',
    features: ['Alles in Growth', 'Erweiterte Analysen', 'API-Zugang', 'Persönlicher Support'],
  },
]

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function SubscriptionPage() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: sub, isLoading } = useQuery<SubscriptionResponse>({
    queryKey: ['subscription', businessId],
    queryFn: () => subscriptionApi.get(businessId!),
    enabled: !!businessId,
  })

  const createSub = useMutation({
    mutationFn: (tier: string) => subscriptionApi.create(tier),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscription'] }); setActionError(null) },
    onError: (err: Error) => setActionError(err.message),
  })

  const changeTier = useMutation({
    mutationFn: (tier: string) => subscriptionApi.changeTier(tier),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscription'] }); setActionError(null) },
    onError: (err: Error) => setActionError(err.message),
  })

  const cancelSub = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscription'] }); setConfirmCancel(false) },
    onError: (err: Error) => setActionError(err.message),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Wird geladen…</div>
  }

  const currentTier = sub?.tier ?? 'Free'
  const isPaid = !!sub?.stripeSubscriptionId

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Abonnement</h1>

      {/* Current status */}
      {sub && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-center justify-between text-sm">
          <div>
            <span className="text-green-700 font-medium">Aktueller Plan: {sub.tier}</span>
            {sub.currentPeriodEnd && (
              <span className="text-green-600 ml-3">· Verlängert sich am {formatDate(sub.currentPeriodEnd)}</span>
            )}
            {sub.cancelAtPeriodEnd && (
              <span className="text-red-500 ml-3">· Endet am {formatDate(sub.currentPeriodEnd)}</span>
            )}
          </div>
          {isPaid && !sub.cancelAtPeriodEnd && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Abonnement kündigen
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.name
          const busy = createSub.isPending || changeTier.isPending

          return (
            <div
              key={tier.name}
              className={`bg-white border rounded-xl p-5 flex flex-col
                ${isCurrent ? 'border-green-500 ring-1 ring-green-300' : tier.highlight ? 'border-green-200' : 'border-gray-200'}`}
            >
              {tier.highlight && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full self-start mb-2">
                  Beliebt
                </span>
              )}
              <h3 className="text-base font-semibold text-gray-900">{tier.name}</h3>
              <p className="text-xl font-bold text-gray-900 mt-1">{tier.price}</p>
              <p className="text-xs text-gray-500 mb-4">{tier.fee}</p>

              <ul className="space-y-1.5 flex-1 mb-5">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium text-center">
                  Aktueller Plan
                </div>
              ) : tier.name === 'Free' ? (
                <div className="w-full py-2 rounded-lg bg-gray-50 text-gray-400 text-sm text-center">
                  Wechsel via Kündigung
                </div>
              ) : (
                <button
                  disabled={busy}
                  onClick={() =>
                    isPaid ? changeTier.mutate(tier.name) : createSub.mutate(tier.name)
                  }
                  className="w-full py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
                >
                  {busy ? 'Wird verarbeitet…' : isPaid ? 'Wechseln' : 'Upgraden'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Abonnement kündigen?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Dein Plan bleibt bis {formatDate(sub?.currentPeriodEnd)} aktiv. Danach wechselst du automatisch zum Free-Tarif.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300"
              >
                Plan behalten
              </button>
              <button
                onClick={() => cancelSub.mutate()}
                disabled={cancelSub.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {cancelSub.isPending ? 'Wird gekündigt…' : 'Kündigung bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
