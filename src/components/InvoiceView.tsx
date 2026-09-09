'use client'

import { useState } from 'react'
import { calculateInvoice, calculateLedgerCharge, LineItem } from '@/utils/invoiceMath'
import { CheckCircle, CreditCard, Banknote, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { openDB } from 'idb'

import { motion, AnimatePresence } from 'framer-motion'

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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="flex flex-col items-center justify-center h-screen px-4 text-center bg-green-50"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
        >
          <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        </motion.div>
        <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase">Paid</h1>
        <p className="text-xl font-bold text-gray-600 mb-12 uppercase tracking-widest">
          ${(invoice.totalCents / 100).toFixed(2)} VIA {paymentMethod === 'card' ? 'CARD' : paymentMethod === 'cash' ? 'CASH' : 'TAB'}
        </p>
        <Link 
          href="/"
          className="w-full max-w-md mx-auto bg-gray-900 text-white min-h-[80px] font-black text-2xl uppercase tracking-widest active:bg-gray-800 transition-colors flex items-center justify-center"
        >
          RETURN TO JOBS
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50 min-h-screen relative pb-40">
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center p-4 bg-gray-900 text-white shadow-md sticky top-0 z-10"
      >
        <Link href="/" className="p-3 -ml-3 text-gray-300 active:text-white rounded-lg">
          <ArrowLeft className="w-8 h-8" />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-widest ml-2">INV-{jobId.substring(0, 4)}</h1>
      </motion.div>

      {/* Massive Total (The focal point) */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
        className="py-12 px-4 text-center bg-white border-b-4 border-gray-200"
      >
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL DUE</p>
        <h2 className="text-[5rem] font-black text-gray-900 leading-none tracking-tighter">
          <span className="text-4xl align-super text-gray-300 mr-1">$</span>
          {(invoice.totalCents / 100).toFixed(0)}
          <span className="text-3xl text-gray-300">.{(invoice.totalCents % 100).toString().padStart(2, '0')}</span>
        </h2>
      </motion.div>

      {/* Line Items */}
      <div className="p-4 bg-white mt-4 border-y-2 border-gray-200">
        <div className="space-y-4 mb-2">
          {initialLineItems.map(item => (
            <div key={item.id} className="flex justify-between items-start text-lg">
              <div>
                <p className="font-black text-gray-900 uppercase tracking-tight">{item.description}</p>
                <p className="font-bold text-gray-400">
                  {item.quantity} x ${(item.amountCents / 100).toFixed(2)}
                </p>
              </div>
              <p className="font-black text-gray-900">
                ${((item.amountCents * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
          
          <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-4 text-lg font-bold text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span className="uppercase tracking-widest">SUBTOTAL</span>
              <span>${(invoice.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase tracking-widest">TAX (8.5%)</span>
              <span>${(invoice.taxCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Area */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t-4 border-gray-200 p-4 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-50">
        {/* Payment Methods */}
        <div className="flex space-x-2 mb-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 flex flex-col items-center justify-center min-h-[72px] border-2 transition-colors ${
              paymentMethod === 'card' ? 'border-blue-600 bg-blue-100 text-blue-800' : 'border-gray-300 bg-gray-50 text-gray-500 active:bg-gray-100'
            }`}
          >
            <CreditCard className="w-8 h-8 mb-1" />
            <span className="text-xs font-black uppercase tracking-widest">CARD</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 flex flex-col items-center justify-center min-h-[72px] border-2 transition-colors ${
              paymentMethod === 'cash' ? 'border-green-600 bg-green-100 text-green-800' : 'border-gray-300 bg-gray-50 text-gray-500 active:bg-gray-100'
            }`}
          >
            <Banknote className="w-8 h-8 mb-1" />
            <span className="text-xs font-black uppercase tracking-widest">CASH</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPaymentMethod('tab')}
            className={`flex-1 flex flex-col items-center justify-center min-h-[72px] border-2 transition-colors ${
              paymentMethod === 'tab' ? 'border-purple-600 bg-purple-100 text-purple-800' : 'border-gray-300 bg-gray-50 text-gray-500 active:bg-gray-100'
            }`}
          >
            <UserPlus className="w-8 h-8 mb-1" />
            <span className="text-xs font-black uppercase tracking-widest">TAB</span>
          </motion.button>
        </div>

        {/* Pay Button */}
        <motion.button
          whileTap={paymentMethod ? { scale: 0.98 } : {}}
          onClick={handlePay}
          disabled={!paymentMethod}
          className={`w-full min-h-[80px] font-black text-2xl flex items-center justify-center uppercase tracking-widest transition-all ${
            paymentMethod === 'card' ? 'bg-blue-600 text-white active:bg-blue-700 shadow-lg' :
            paymentMethod === 'cash' ? 'bg-green-600 text-white active:bg-green-700 shadow-lg' :
            paymentMethod === 'tab' ? 'bg-purple-600 text-white active:bg-purple-700 shadow-lg' :
            'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {paymentMethod ? `COLLECT $${(invoice.totalCents / 100).toFixed(2)}` : 'SELECT PAYMENT'}
        </motion.button>
      </div>
    </div>
  )
}
