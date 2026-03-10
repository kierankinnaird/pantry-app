'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState('account') // 'account' | 'household'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [householdMode, setHouseholdMode] = useState('create') // 'create' | 'join'
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAccountStep(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setStep('household')
  }

  async function handleHouseholdStep(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Signup failed — please try again')
      setLoading(false)
      return
    }

    let householdId

    if (householdMode === 'create') {
      const { data: hh, error: hhError } = await supabase
        .from('households')
        .insert({ name: householdName })
        .select('id')
        .single()

      if (hhError) {
        setError(hhError.message)
        setLoading(false)
        return
      }
      householdId = hh.id
    } else {
      const code = inviteCode.trim().toUpperCase()
      const { data: hh, error: hhError } = await supabase
        .from('households')
        .select('id')
        .eq('invite_code', code)
        .single()

      if (hhError || !hh) {
        setError('Invite code not found — check it and try again')
        setLoading(false)
        return
      }
      householdId = hh.id
    }

    // Link profile to household
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdId })
      .eq('id', userId)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4">
            <span className="text-2xl">🥫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'account' ? 'Step 1 of 2 — Your details' : 'Step 2 of 2 — Your household'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          <div className="h-1 flex-1 rounded-full bg-green-600" />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'household' ? 'bg-green-600' : 'bg-gray-200'}`} />
        </div>

        {step === 'account' ? (
          <form onSubmit={handleAccountStep} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Kieran"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" className="w-full py-3 px-4 rounded-xl bg-green-600 text-white font-semibold text-base active:bg-green-700 transition-colors mt-2">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleHouseholdStep} className="space-y-4">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setHouseholdMode('create')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${householdMode === 'create' ? 'bg-green-600 text-white' : 'text-gray-600'}`}
              >
                Create Household
              </button>
              <button
                type="button"
                onClick={() => setHouseholdMode('join')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${householdMode === 'join' ? 'bg-green-600 text-white' : 'text-gray-600'}`}
              >
                Join Household
              </button>
            </div>

            {householdMode === 'create' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Household name</label>
                <input
                  type="text"
                  required
                  value={householdName}
                  onChange={e => setHouseholdName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="The Kinnaird Household"
                />
                <p className="text-xs text-gray-400 mt-2">Others can join using your invite code from settings.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invite code</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="text-xs text-gray-400 mt-2">Ask a household member for their 6-character invite code.</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setStep('account'); setError('') }}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-base active:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold text-base active:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Setting up…' : householdMode === 'create' ? 'Create' : 'Join'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
