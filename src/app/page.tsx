import { JobBoard } from '@/components/JobBoard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Job } from '@/types'

const MOCK_JOBS: Job[] = [
  {
    id: 'mock-1',
    customer: { id: 'c1', name: 'Alice Smith', phone: '555-0101', address: '123 Main St', balance_cents: 0 },
    scheduled_date: new Date().toISOString(),
    status: 'Scheduled',
    service_type: 'Installation',
    notes: 'Please call before arriving.',
    invoice_amount_cents: 15000,
  },
  {
    id: 'mock-2',
    customer: { id: 'c2', name: 'Bob Jones', phone: '555-0202', address: '456 Elm St', balance_cents: 0 },
    scheduled_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'In Progress',
    service_type: 'Maintenance',
    notes: 'Quarterly checkup.',
    invoice_amount_cents: 8500,
  }
]

export default async function Home() {
  // 1. Check for missing environment variables first
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="min-h-screen bg-gray-100 relative">
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-sm text-center font-medium z-50 relative">
          Running in offline mode: Missing Supabase environment variables. Showing mock data.
        </div>
        <JobBoard initialJobs={MOCK_JOBS} />
      </main>
    )
  }

  // 2. Initialize Supabase (calls cookies(), which can throw DynamicServerError in build)
  // We do NOT wrap this in try/catch to avoid swallowing Next.js internal routing/build errors.
  const supabase = await createClient()
  
  // 3. Auth Verification
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // redirect() throws NEXT_REDIRECT. Must not be caught.
    redirect('/login')
  }

  let isOfflineMode = false;
  let formattedJobs: Job[] = MOCK_JOBS;
  let errorMessage = '';

  // 4. Fetch jobs (This is safe to try/catch because it's just a fetch)
  try {
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

    if (dbError) throw dbError;

    formattedJobs = (jobs || []).map(job => {
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
      <JobBoard initialJobs={formattedJobs} />
    </main>
  )
}
