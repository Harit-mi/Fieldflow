import { CustomerDetail } from '@/components/CustomerDetail'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-gray-100">
      <CustomerDetail customerId={id} />
    </main>
  )
}
