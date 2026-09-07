import { CustomerDetail } from '@/components/CustomerDetail'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch customer details, ledger balance, and job history
  const { data: customer } = await supabase
    .from('customers')
    .select(`
      id,
      name,
      phone,
      address,
      customer_ledger (
        delta_cents
      ),
      jobs (
        id,
        service_type,
        scheduled_date,
        status,
        notes,
        invoices (
          amount_cents,
          status
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Customer not found</div>
  }

  // Aggregate balance
  const ledgers = Array.isArray(customer.customer_ledger) ? customer.customer_ledger : []
  const balance_cents = ledgers.reduce((acc, l: { delta_cents: number }) => acc + (l.delta_cents || 0), 0)

  // Format job history
  const jobs = Array.isArray(customer.jobs) ? customer.jobs : []
  const history = jobs.map(j => {
    const invoices = Array.isArray(j.invoices) ? j.invoices : (j.invoices ? [j.invoices] : [])
    const invoice = invoices[0]
    return {
      id: j.id,
      service_type: j.service_type,
      scheduled_date: j.scheduled_date,
      status: j.status,
      notes: j.notes,
      invoice_amount_cents: invoice?.amount_cents,
      invoice_status: invoice?.status
    }
  }).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())

  const formattedCustomer = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    balance_cents
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <CustomerDetail customer={formattedCustomer} jobHistory={history} />
    </main>
  )
}
