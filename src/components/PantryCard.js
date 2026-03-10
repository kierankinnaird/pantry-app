'use client'

import Link from 'next/link'
import Image from 'next/image'

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700', urgent: true }
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: 'bg-red-100 text-red-700', urgent: true }
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'bg-amber-100 text-amber-700', urgent: false }
  return { label: `${daysLeft}d`, color: 'bg-gray-100 text-gray-500', urgent: false }
}

function QuantityBar({ quantity, initial }) {
  const pct = Math.min(100, Math.max(0, (quantity / initial) * 100))
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function PantryCard({ item }) {
  const expiry = getExpiryStatus(item.expiry_date)
  const pct = Math.min(100, Math.max(0, (item.quantity / item.initial_quantity) * 100))
  const isEmpty = item.quantity <= 0

  return (
    <Link href={`/item/${item.id}`} className="block">
      <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all active:scale-[0.98] ${expiry?.urgent ? 'border-red-200' : 'border-gray-100'}`}>
        <div className="flex items-start gap-3">
          {/* Image or emoji placeholder */}
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-2xl">🥫</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate leading-tight">{item.name}</p>
                {item.brand && <p className="text-xs text-gray-400 truncate">{item.brand}</p>}
              </div>
              {expiry && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${expiry.color}`}>
                  {expiry.label}
                </span>
              )}
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isEmpty ? 'text-red-500' : 'text-gray-700'}`}>
                  {isEmpty ? 'Out of stock' : `${item.quantity} ${item.unit}`}
                </span>
                <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
              </div>
              <QuantityBar quantity={item.quantity} initial={item.initial_quantity} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
