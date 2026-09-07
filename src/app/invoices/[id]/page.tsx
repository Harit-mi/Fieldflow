import { InvoiceView } from '@/components/InvoiceView'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-gray-100">
      <InvoiceView jobId={id} />
    </main>
  )
}
