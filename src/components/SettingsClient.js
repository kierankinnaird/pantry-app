'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from './BottomNav'

export default function SettingsClient({ user, household }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function copyCode() {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Profile */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
              {user.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.display_name || 'No name set'}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Household */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Household</h2>

          {household ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Name</p>
                <p className="font-semibold text-gray-900">{household.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Invite Code</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <span className="font-mono text-2xl font-bold tracking-[0.2em] text-gray-900">
                      {household.invite_code}
                    </span>
                  </div>
                  <button
                    onClick={copyCode}
                    className="bg-green-600 text-white px-4 py-3 rounded-xl font-semibold text-sm active:bg-green-700 min-w-[80px] text-center"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Share this code with household members so they can join.</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Not in a household. <a href="/signup" className="text-green-600 font-medium">Set one up →</a></p>
          )}
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full px-5 py-4 text-left text-red-600 font-semibold active:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
