import { JobBoard } from '@/components/JobBoard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const MOCK_JOBS = [
  {
    id: 'mock-1',
    customer: { id: 'c1', name: 'Alice Smith', phone: '555-0101', address: '123 Main St', balance_cents: 0 },
    scheduled_date: new Date().toISOString(),
    status: 'scheduled' as any,
    service_type: 'Installation',
    notes: 'Please call before arriving.',
    invoice_amount_cents: 15000,
  },
  {
    id: 'mock-2',
    customer: { id: 'c2', name: 'Bob Jones', phone: '555-0202', address: '456 Elm St', balance_cents: 0 },
    scheduled_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'in_progress' as any,
    service_type: 'Maintenance',
    notes: 'Quarterly checkup.',
    invoice_amount_cents: 8500,
  }
]

export default async function Home() {
  let isOfflineMode = false;
  let formattedJobs = MOCK_JOBS;
  let errorMessage = '';
  let shouldRedirect = false;

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = await createClient()
    
    // Auth Verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) throw authError;

    if (!user) {
      shouldRedirect = true;
    } else {
      // Fetch jobs for today and future
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
          status: job.status as any,
          service_type: job.service_type,
          notes: job.notes,
          invoice_amount_cents
        }
      })
    }
  } catch (error: any) {
    console.error('Server Data Fetch Error:', error.message || error);
    isOfflineMode = true;
    errorMessage = error.message || 'Unknown database error';
  }

  // We handle redirect outside the try/catch so Next.js NEXT_REDIRECT error isn't swallowed
  if (shouldRedirect) {
    redirect('/login')
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
