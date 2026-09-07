import { JobBoard } from '@/components/JobBoard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  
  // Auth Verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch jobs for today and future
  // Note: RLS automatically scopes this to the user's organization
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      scheduled_date,
      status,
      service_type,
      notes,
      customers (
        id,
        name,
        phone,
        address
      ),
      invoices (
        amount_cents
      )
    `)
    .order('scheduled_date', { ascending: true })

  // Transform data to match the Job type expected by JobBoard
  const formattedJobs = (jobs || []).map(job => {
    // customers should be an array of length 1 or an object depending on schema. 
    // Usually a many-to-one is an object in supabase-js
    const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers
    
    // We compute the invoice amount if available (for the unpaid total strip)
    const invoices = Array.isArray(job.invoices) ? job.invoices : (job.invoices ? [job.invoices] : [])
    const invoice_amount_cents = invoices.reduce((acc: number, inv: { amount_cents: number }) => acc + inv.amount_cents, 0)

    return {
      id: job.id,
      customer: {
        id: customer?.id || 'unknown',
        name: customer?.name || 'Unknown',
        phone: customer?.phone || '',
        address: customer?.address || '',
        balance_cents: 0 // We'll ignore balance_cents for the job board unless needed
      },
      scheduled_date: job.scheduled_date,
      status: job.status,
      service_type: job.service_type,
      notes: job.notes,
      invoice_amount_cents
    }
  })

  return (
    <main className="min-h-screen bg-gray-100">
      <JobBoard initialJobs={formattedJobs} />
    </main>
  )
}
