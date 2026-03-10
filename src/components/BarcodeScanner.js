'use client'

import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onDetected, onError }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [status, setStatus] = useState('starting') // 'starting' | 'scanning' | 'error'

  useEffect(() => {
    let controls = null

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        // Prefer back camera
        const device = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1]

        if (!device) throw new Error('No camera found')

        setStatus('scanning')

        controls = await reader.decodeFromVideoDevice(
          device.deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              onDetected(result.getText())
            }
            // NotFoundException fires every frame with no barcode — ignore it
            if (error && error.name !== 'NotFoundException') {
              console.warn('Scanner error:', error)
            }
          }
        )
      } catch (err) {
        setStatus('error')
        onError?.(err.message || 'Camera unavailable')
      }
    }

    startScanner()

    return () => {
      controls?.stop()
    }
  }, [onDetected, onError])

  return (
    <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scanning overlay */}
      {status === 'scanning' && (
        <>
          {/* Dark corners */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/40" style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 25%, 20% 25%, 20% 75%, 80% 75%, 80% 25%, 0 25%)'
            }} />
          </div>

          {/* Finder box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/5 aspect-[3/2] relative">
              {/* Corners */}
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 border-green-400 ${cls}`} />
              ))}

              {/* Scan line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-green-400 opacity-80 animate-scan" />
            </div>
          </div>

          <p className="absolute bottom-6 inset-x-0 text-center text-white text-sm font-medium opacity-80">
            Point at a barcode
          </p>
        </>
      )}

      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
          <span className="text-4xl">📷</span>
          <p className="text-white text-center text-sm">Camera access denied or unavailable</p>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; position: absolute; }
      `}</style>
    </div>
  )
}
