'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const UNIT_OPTIONS = {
  weight: ['g', 'kg'],
  volume: ['ml', 'L'],
  count: ['units', 'items', 'pieces'],
}

function AddItemForm() {
  const router = useRouter()
  const params = useSearchParams()
  const barcode = params.get('barcode') || ''

  const [loading, setLoading] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [unitType, setUnitType] = useState('weight')
  const [unit, setUnit] = useState('g')
  const [quantity, setQuantity] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [manualBarcode, setManualBarcode] = useState(barcode)

  useEffect(() => {
    if (barcode) lookupBarcode(barcode)
    else setLookupDone(true)
  }, [barcode])

  // Keep unit in sync with unitType
  useEffect(() => {
    setUnit(UNIT_OPTIONS[unitType][0])
  }, [unitType])

  async function lookupBarcode(code) {
    setLoading(true)
    try {
      const res = await fetch(`/api/lookup?barcode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.found) {
        setName(data.name || '')
        setBrand(data.brand || '')
        setImageUrl(data.image_url || '')
      }
    } catch {}
    setLoading(false)
    setLookupDone(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Item name is required'); return }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError('Enter a valid quantity greater than 0')
      return
    }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single()

    const { error: dbError } = await supabase.from('pantry_items').insert({
      household_id: profile.household_id,
      barcode: manualBarcode || null,
      name: name.trim(),
      brand: brand.trim() || null,
      image_url: imageUrl || null,
      unit_type: unitType,
      unit,
      quantity: Number(quantity),
      initial_quantity: Number(quantity),
      expiry_date: expiryDate || null,
      added_by: user.id,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Looking up product…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-gray-700 active:opacity-60">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Add Item</h1>
      </div>

      <form onSubmit={handleSave} className="px-4 py-5 space-y-5">
        {/* Product image preview */}
        {imageUrl && (
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center shadow-sm">
              <Image src={imageUrl} alt={name} width={96} height={96} className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Barcode (if manual) */}
        {!barcode && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Barcode (optional)</label>
            <div className="flex gap-2">
              <input
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="e.g. 5000128111577"
                className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => manualBarcode && lookupBarcode(manualBarcode)}
                className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:bg-green-700"
              >
                Look up
              </button>
            </div>
          </div>
        )}

        {/* Product info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Product Info</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. "Spinach" or "ASDA Spinach"'
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Brand (optional)</label>
            <input
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="e.g. ASDA, Heinz…"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Quantity</h2>

          {/* Unit type toggle */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">Type</label>
            <div className="flex gap-2">
              {Object.keys(UNIT_OPTIONS).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUnitType(type)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    unitType === type ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + unit */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Amount *</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
                min="0.01"
                step="any"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {UNIT_OPTIONS[unitType].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expiry */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date (optional)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-green-600 text-white font-bold text-base rounded-2xl active:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Saving…' : 'Add to Pantry'}
        </button>
      </form>
    </div>
  )
}

export default function AddPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AddItemForm />
    </Suspense>
  )
}
