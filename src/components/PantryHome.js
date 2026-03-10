'use client'

import { useState } from 'react'
import Link from 'next/link'
import PantryCard from './PantryCard'
import BottomNav from './BottomNav'

const FILTERS = ['All', 'Low stock', 'Expiring soon', 'Out of stock']

function isLowStock(item) {
  return item.quantity > 0 && (item.quantity / item.initial_quantity) < 0.25
}

function isExpiringSoon(item) {
  if (!item.expiry_date) return false
  const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / 86400000)
  return daysLeft >= 0 && daysLeft <= 7
}

export default function PantryHome({ items, user }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase())

    if (!matchSearch) return false
    if (filter === 'Low stock') return isLowStock(item)
    if (filter === 'Expiring soon') return isExpiringSoon(item)
    if (filter === 'Out of stock') return item.quantity <= 0
    return true
  })

  const expiringSoon = items.filter(i => isExpiringSoon(i) || (i.expiry_date && new Date(i.expiry_date) < new Date())).length
  const lowStock = items.filter(i => isLowStock(i)).length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pantry</h1>
              <p className="text-xs text-gray-400">Hi, {user.display_name || 'there'} 👋</p>
            </div>
            <Link
              href="/scan"
              className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl active:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m10-14h4a2 2 0 012 2v4m-6 10h4a2 2 0 002-2v-4M7 12h10" />
              </svg>
              Scan
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pantry…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {f}
              {f === 'Expiring soon' && expiringSoon > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full">{expiringSoon}</span>
              )}
              {f === 'Low stock' && lowStock > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[9px] px-1 py-0.5 rounded-full">{lowStock}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">{items.length === 0 ? '🥫' : '🔍'}</span>
            <p className="text-gray-900 font-semibold">
              {items.length === 0 ? 'Your pantry is empty' : 'Nothing found'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {items.length === 0 ? 'Scan a barcode to add your first item' : 'Try a different search or filter'}
            </p>
            {items.length === 0 && (
              <Link
                href="/scan"
                className="mt-6 bg-green-600 text-white font-semibold px-6 py-3 rounded-xl text-sm active:bg-green-700 transition-colors"
              >
                Scan First Item
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(item => (
              <PantryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
