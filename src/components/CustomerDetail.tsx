'use client'

import { Customer } from '@/types'
import { ArrowLeft, MapPin, Phone, Calendar, Banknote } from 'lucide-react'
import Link from 'next/link'

interface JobHistoryItem {
  id: string;
  service_type: string;
  scheduled_date: string;
  status: string;
  notes: string;
  invoice_amount_cents?: number;
  invoice_status?: string;
}

export function CustomerDetail({ customer, jobHistory }: { customer: Customer, jobHistory: JobHistoryItem[] }) {
  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-center">
        <Link href="/customers" className="p-2 -ml-2 text-gray-500 active:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 ml-2">Customer Info</h1>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-2xl font-black text-gray-900 mb-5">{customer.name}</h2>
          
          <div className="space-y-4">
            <a href={`tel:${customer.phone}`} className="flex items-center text-blue-600 font-semibold text-[15px] active:text-blue-800">
              <Phone className="w-5 h-5 mr-3 text-gray-400" />
              {customer.phone}
            </a>
            <a href={`maps://?q=${encodeURIComponent(customer.address)}`} className="flex items-start text-blue-600 font-semibold text-[15px] active:text-blue-800">
              <MapPin className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
              {customer.address}
            </a>
          </div>
        </div>

        {/* Ledger Card */}
        {customer.balance_cents > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-5 flex flex-col items-center text-center">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Outstanding Balance</p>
            <h3 className="text-4xl font-black text-red-700 mb-5">
              ${(customer.balance_cents / 100).toFixed(2)}
            </h3>
            <button className="w-full bg-red-600 text-white rounded-xl py-4 font-bold text-lg active:bg-red-700 transition-colors flex items-center justify-center">
              <Banknote className="w-5 h-5 mr-2" />
              Record Payment
            </button>
          </div>
        )}

        {/* Job History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-500" />
              Job History
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {jobHistory.length === 0 && (
              <div className="p-4 text-center text-gray-500">No job history</div>
            )}
            {jobHistory.map(job => (
              <div key={job.id} className="p-4 active:bg-gray-50">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-gray-900">{job.service_type}</span>
                  <span className="text-gray-500 text-sm font-medium">
                    {new Date(job.scheduled_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-[15px] text-gray-600 mb-3">{job.notes}</p>
                <div className="flex space-x-2">
                   {job.invoice_amount_cents && job.invoice_status === 'Paid' && (
                     <span className="inline-flex items-center rounded-lg bg-green-50 border border-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                       Paid ${(job.invoice_amount_cents / 100).toFixed(2)}
                     </span>
                   )}
                   {job.invoice_amount_cents && job.invoice_status === 'Unpaid' && (
                     <span className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                       Owes ${(job.invoice_amount_cents / 100).toFixed(2)}
                     </span>
                   )}
                   <span className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                     {job.status}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
