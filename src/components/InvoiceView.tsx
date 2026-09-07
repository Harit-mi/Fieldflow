'use client'

import { useState } from 'react'
import { calculateInvoice, calculateLedgerCharge, LineItem } from '@/utils/invoiceMath'
import { CheckCircle, CreditCard, Banknote, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { openDB } from 'idb'

export function InvoiceView({ 
  jobId, 
  invoiceId,
  initialLineItems 
}: { 
  jobId: string, 
  invoiceId: string,
  initialLineItems: LineItem[] 
}) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'tab' | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const supabase = createClient()
  
  const invoice = calculateInvoice({
    lineItems: initialLineItems,
    taxRatePercent: 8.5,
    tipCents: 0,
    amountPaidCents: 0 // We're calculating the full invoice first
  })

  const handlePay = async () => {
    if (!paymentMethod) return
    
    // Determine how much is paid on site (Cash/Card) vs goes to Tab
    const amountPaidOnSiteCents = paymentMethod === 'tab' ? 0 : invoice.totalCents
    const ledgerChargeCents = calculateLedgerCharge(invoice.totalCents, amountPaidOnSiteCents)
    
    // Update local UI immediately
    setIsPaid(true)

    // Queue mutations in IndexedDB for offline resilience
    const db = await openDB('fieldflow-sync', 1)
    
    // 1. Mark Invoice as Paid
    await db.add('sync_queue', {
      type: 'invoice_payment',
      payload: { 
        invoiceId, 
        jobId,
        paymentMethod,
        ledgerChargeCents, // What we will add to the customer_ledger (if > 0)
        status: 'Paid',
        paidAt: new Date().toISOString()
      },
      created_at: Date.now()
    })
    
    // Note: The actual flush logic would run via a global sync listener (e.g. in layout or JobBoard)
    // For this MVP component, we attempt to flush it immediately:
    if (navigator.onLine) {
      const { data: jobInfo } = await supabase.from('jobs').select('customer_id').eq('id', jobId).single()
      if (jobInfo) {
        await supabase
          .from('invoices')
          .update({ 
            status: 'Paid', 
            payment_method: paymentMethod, 
            paid_at: new Date().toISOString() 
          })
          .eq('id', invoiceId)
          
        if (ledgerChargeCents > 0) {
          await supabase.from('customer_ledger').insert({
            customer_id: jobInfo.customer_id,
            delta_cents: ledgerChargeCents, // positive means they owe us
            reason: 'Invoice payment remainder',
            related_invoice_id: invoiceId
          })
        }
        
        // Also update the job status to Paid
        await supabase.from('jobs').update({ status: 'Paid' }).eq('id', jobId)
      }
    }
  }

  if (isPaid) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-green-50">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-black text-gray-900 mb-2">Paid</h1>
        <p className="text-xl text-gray-600 mb-12">
          ${(invoice.totalCents / 100).toFixed(2)} via {paymentMethod === 'card' ? 'Card' : paymentMethod === 'cash' ? 'Cash' : 'Account Tab'}
        </p>
        <Link 
          href="/"
          className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-xl py-4 font-bold text-lg active:bg-gray-800 transition-colors block"
        >
          Return to Schedule
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <Link href="/" className="p-2 -ml-2 text-gray-500 active:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold ml-2">Invoice #INV-{jobId.substring(0, 3).toUpperCase()}</h1>
      </div>

      {/* Massive Total (The focal point) */}
      <div className="py-10 text-center bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Total Due</p>
        <h2 className="text-6xl font-black text-gray-900 tracking-tight">
          <span className="text-3xl align-super mr-1 text-gray-400">$</span>
          {(invoice.totalCents / 100).toFixed(2)}
        </h2>
      </div>

      {/* Line Items */}
      <div className="p-6">
        <div className="space-y-4 mb-8">
          {initialLineItems.map(item => (
            <div key={item.id} className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">{item.description}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} x ${(item.amountCents / 100).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                ${((item.amountCents * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
          
          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="flex justify-between text-gray-500 mb-2">
              <span>Subtotal</span>
              <span>${(invoice.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 mb-2">
              <span>Tax (8.5%)</span>
              <span>${(invoice.taxCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-lg mt-4">
              <span>Total</span>
              <span>${(invoice.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 active:bg-gray-50'
              }`}
            >
              <CreditCard className="w-6 h-6 mb-2" />
              <span className="text-sm font-semibold">Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 active:bg-gray-50'
              }`}
            >
              <Banknote className="w-6 h-6 mb-2" />
              <span className="text-sm font-semibold">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('tab')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'tab' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 active:bg-gray-50'
              }`}
            >
              <UserPlus className="w-6 h-6 mb-2" />
              <span className="text-sm font-semibold">Tab</span>
            </button>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={!paymentMethod}
          className={`w-full py-5 rounded-xl font-black text-xl flex items-center justify-center transition-all ${
            paymentMethod 
              ? 'bg-blue-600 text-white active:bg-blue-700 shadow-lg shadow-blue-200 transform active:scale-[0.98]' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {paymentMethod ? `Collect $${(invoice.totalCents / 100).toFixed(2)}` : 'Select Payment Method'}
        </button>
      </div>
    </div>
  )
}
