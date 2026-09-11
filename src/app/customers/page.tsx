import { CustomerList } from '@/components/CustomerList'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Customer } from '@/types'

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Alice Smith', phone: '555-0101', address: '123 Main St', balance_cents: 15000 },
  { id: 'c2', name: 'Bob Jones', phone: '555-0202', address: '456 Elm St', balance_cents: 0 },
  { id: 'c3', name: 'Carol White', phone: '555-0303', address: '789 Oak Ave', balance_cents: 5000 },
]

export default async function CustomersPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="min-h-screen bg-gray-100 relative">
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-sm text-center font-medium z-50 relative">
          Running in offline mode: Missing Supabase environment variables. Showing mock data.
        </div>
        <CustomerList initialCustomers={MOCK_CUSTOMERS} />
      </main>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let isOfflineMode = false;
  let formattedCustomers: Customer[] = MOCK_CUSTOMERS;
  let errorMessage = '';

  try {
    // Fetch customers and sum up their ledger balances
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

    if (error) throw error;

    formattedCustomers = (customers || []).map(c => {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Server Data Fetch Error:', message);
    isOfflineMode = true;
    errorMessage = message;
  }

  return (
    <main className="min-h-screen bg-gray-100 relative">
      {isOfflineMode && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-sm text-center font-medium z-50 relative">
          Running in offline mode: {errorMessage}. Showing mock data.
        </div>
      )}
      <CustomerList initialCustomers={formattedCustomers} />
    </main>
  )
}
