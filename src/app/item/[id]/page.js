import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ItemDetail from '@/components/ItemDetail'

export default async function ItemPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) redirect('/')

  const { data: log } = await supabase
    .from('usage_log')
    .select('*, profiles(display_name)')
    .eq('item_id', id)
    .order('used_at', { ascending: false })
    .limit(10)

  return <ItemDetail item={item} usageLog={log || []} userId={user.id} />
}
