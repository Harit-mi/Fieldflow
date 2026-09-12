import { CustomerList } from '@/components/CustomerList'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Customer } from '@/types'

export default async function CustomersPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('CRITICAL ERROR: Missing Supabase environment variables. Refusing to serve mock data in production.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      id,
      name,
      phone,
      address,
      customer_ledger (
        delta_cents
      )
    `)
    .order('name')

  if (error) {
    throw new Error(`CRITICAL ERROR: Failed to fetch customers. ${error.message}`)
  }

  const formattedCustomers = (customers || []).map(c => {
    const ledgers = Array.isArray(c.customer_ledger) ? c.customer_ledger : []
    const balance_cents = ledgers.reduce((acc, l: { delta_cents: number }) => acc + (l.delta_cents || 0), 0)
    
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      balance_cents
    }
  })

  return (
    <main className="min-h-screen bg-gray-100 relative">
      <CustomerList initialCustomers={formattedCustomers} />
    </main>
  )
}
