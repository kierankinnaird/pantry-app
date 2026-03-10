'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

export default function ScanPage() {
  const router = useRouter()
  const [detected, setDetected] = useState(false)
  const [error, setError] = useState('')

  const handleDetected = useCallback((barcode) => {
    if (detected) return
    setDetected(true)
    // Vibrate on detection
    if (navigator.vibrate) navigator.vibrate(100)
    router.push(`/add?barcode=${encodeURIComponent(barcode)}`)
  }, [detected, router])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-safe pt-12 pb-4 bg-black/80">
        <button
          onClick={() => router.back()}
          className="text-white active:opacity-60 transition-opacity"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-semibold text-lg">Scan Barcode</h1>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        <div className="w-full max-w-sm">
          {!detected ? (
            <BarcodeScanner onDetected={handleDetected} onError={setError} />
          ) : (
            <div className="aspect-square bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-green-400 text-sm font-medium">Barcode detected!</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm text-center max-w-sm w-full">
            {error}
          </div>
        )}

        <p className="text-gray-500 text-sm text-center">
          Hold your camera steady over the barcode
        </p>

        {/* Manual entry fallback */}
        <button
          onClick={() => router.push('/add')}
          className="text-green-400 text-sm font-medium active:opacity-60"
        >
          Enter barcode manually →
        </button>
      </div>
    </div>
  )
}
