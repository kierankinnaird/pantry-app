import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, household_id')
    .eq('id', user.id)
    .single()

  const { data: household } = profile?.household_id
    ? await supabase.from('households').select('name, invite_code').eq('id', profile.household_id).single()
    : { data: null }

  return (
    <SettingsClient
      user={{ email: user.email, ...profile }}
      household={household}
    />
  )
}
