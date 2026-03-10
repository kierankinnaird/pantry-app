import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PantryHome from '@/components/PantryHome'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id, display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/signup')

  const { data: items } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  return <PantryHome items={items || []} user={{ ...user, ...profile }} />
}
