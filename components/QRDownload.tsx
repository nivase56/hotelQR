// components/QRDownload.tsx
'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QRDownload({ hotelId }: { hotelId: string }) {
  const [qr, setQr] = useState('')

  useEffect(() => {
    // Generate QR pointing to the guest menu
    const url = `${window.location.origin}/menu/${hotelId}`
    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#09090b', // zinc-950
        light: '#ffffff',
      },
    }).then(setQr)
  }, [hotelId])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs">
      <div className="relative p-4 bg-white rounded-3xl shadow-xl border border-zinc-200/50 transition-all duration-300 group-hover:scale-[1.02]">
        {/* Soft shadow accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {qr ? (
          <img
            src={qr}
            alt="Menu QR Code"
            className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-2xl"
          />
        ) : (
          <div className="w-48 h-48 md:w-56 md:h-56 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      <a
        href={qr}
        download={`qr-${hotelId}.png`}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-violet-950/25 transition-all duration-150 active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Download QR Code</span>
      </a>
    </div>
  )
}