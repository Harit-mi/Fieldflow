import { JobBoard } from '@/components/JobBoard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Job } from '@/types'

export default async function Home() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('CRITICAL ERROR: Missing Supabase environment variables. Refusing to serve mock data in production.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: jobs, error: dbError } = await supabase
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

  if (dbError) {
    throw new Error(`CRITICAL ERROR: Failed to fetch jobs. ${dbError.message}`)
  }

  const formattedJobs: Job[] = (jobs || []).map(job => {
    const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers
    const invoices = Array.isArray(job.invoices) ? job.invoices : (job.invoices ? [job.invoices] : [])
    const invoice_amount_cents = invoices.reduce((acc: number, inv: { amount_cents: number }) => acc + inv.amount_cents, 0)

    return {
      id: job.id,
      customer: {
        id: customer?.id || 'unknown',
        name: customer?.name || 'Unknown',
        phone: customer?.phone || '',
        address: customer?.address || '',
        balance_cents: 0
      },
      scheduled_date: job.scheduled_date,
      status: job.status as Job['status'],
      service_type: job.service_type,
      notes: job.notes,
      invoice_amount_cents
    }
  })

  return (
    <main className="min-h-screen bg-gray-100 relative">
      <JobBoard initialJobs={formattedJobs} />
    </main>
  )
}
