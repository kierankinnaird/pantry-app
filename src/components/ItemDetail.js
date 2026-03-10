'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function ExpiryBadge({ date }) {
  if (!date) return null
  const days = Math.ceil((new Date(date) - new Date()) / 86400000)
  if (days < 0) return <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Expired</span>
  if (days <= 3) return <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Expires in {days}d</span>
  if (days <= 7) return <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Expires in {days}d</span>
  return <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Expires in {days}d</span>
}

export default function ItemDetail({ item, usageLog, userId }) {
  const router = useRouter()
  const [showUseModal, setShowUseModal] = useState(false)
  const [useAmount, setUseAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const pct = Math.min(100, Math.max(0, (item.quantity / item.initial_quantity) * 100))
  const barColor = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500'

  async function handleUse(e) {
    e.preventDefault()
    const amount = Number(useAmount)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    if (amount > item.quantity) { setError(`You only have ${item.quantity} ${item.unit} left`); return }

    setSaving(true)
    setError('')
    const supabase = createClient()

    const newQty = Math.max(0, item.quantity - amount)
    const { error: e1 } = await supabase
      .from('pantry_items')
      .update({ quantity: newQty })
      .eq('id', item.id)

    const { error: e2 } = await supabase
      .from('usage_log')
      .insert({ item_id: item.id, quantity_used: amount, used_by: userId })

    if (e1 || e2) {
      setError(e1?.message || e2?.message)
      setSaving(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('pantry_items').delete().eq('id', item.id)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-gray-700 active:opacity-60">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate px-2">{item.name}</h1>
        <button onClick={handleDelete} disabled={deleting} className="text-red-400 active:opacity-60 disabled:opacity-30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Product card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {item.image_url
                ? <Image src={item.image_url} alt={item.name} width={64} height={64} className="w-full h-full object-contain" />
                : <span className="text-3xl">🥫</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              {item.brand && <p className="text-sm text-gray-400">{item.brand}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {item.barcode && <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.barcode}</span>}
                <ExpiryBadge date={item.expiry_date} />
              </div>
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Remaining</span>
            <span className="text-sm text-gray-400">{Math.round(pct)}% of original</span>
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-3">
            {item.quantity} <span className="text-lg font-medium text-gray-400">{item.unit}</span>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0</span>
            <span>{item.initial_quantity} {item.unit} (original)</span>
          </div>
        </div>

        {/* Use button */}
        {item.quantity > 0 && !showUseModal && (
          <button
            onClick={() => setShowUseModal(true)}
            className="w-full py-4 bg-green-600 text-white font-bold text-base rounded-2xl active:bg-green-700 transition-colors shadow-sm"
          >
            Use Some →
          </button>
        )}

        {/* Use modal */}
        {showUseModal && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-4">How much did you use?</h3>
            <form onSubmit={handleUse} className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={useAmount}
                  onChange={e => setUseAmount(e.target.value)}
                  placeholder="0"
                  min="0.01"
                  max={item.quantity}
                  step="any"
                  className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                  autoFocus
                />
                <span className="text-gray-500 font-medium w-12">{item.unit}</span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[0.25, 0.5, 0.75, 1].map(frac => {
                  const val = Math.round(item.initial_quantity * frac * 100) / 100
                  if (val > item.quantity) return null
                  return (
                    <button
                      key={frac}
                      type="button"
                      onClick={() => setUseAmount(String(val))}
                      className="flex-1 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 active:bg-gray-200"
                    >
                      {Math.round(frac * 100)}%
                      <span className="block text-gray-400 font-normal">{val}{item.unit}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setUseAmount(String(item.quantity))}
                  className="flex-1 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 active:bg-gray-200"
                >
                  All
                  <span className="block text-gray-400 font-normal">{item.quantity}{item.unit}</span>
                </button>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowUseModal(false); setUseAmount(''); setError('') }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold active:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold active:bg-green-700 disabled:opacity-50"
                >
                  {saving ? '…' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Usage history */}
        {usageLog.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Usage History</h3>
            <div className="space-y-3">
              {usageLog.map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Used {log.quantity_used} {item.unit}
                    </p>
                    <p className="text-xs text-gray-400">
                      {log.profiles?.display_name || 'Someone'} · {new Date(log.used_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">−{log.quantity_used} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
