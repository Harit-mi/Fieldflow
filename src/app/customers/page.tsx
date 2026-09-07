import { CustomerList } from '@/components/CustomerList'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch customers and sum up their ledger balances
  const { data: customers } = await supabase
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
    <main className="min-h-screen bg-gray-100">
      <CustomerList initialCustomers={formattedCustomers} />
    </main>
  )
}
