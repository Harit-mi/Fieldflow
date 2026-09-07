import { InvoiceView } from '@/components/InvoiceView'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch the invoice for this job
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('job_id', id)
    .single()
    
  if (!invoices) {
    return <div className="p-8 text-center text-gray-500">Invoice not found</div>
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <InvoiceView 
        jobId={id} 
        invoiceId={invoices.id}
        initialLineItems={invoices.line_items} 
      />
    </main>
  )
}
