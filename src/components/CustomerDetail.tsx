'use client'

import { Customer } from '@/types'
import { ArrowLeft, MapPin, Phone, Calendar, Banknote } from 'lucide-react'
import Link from 'next/link'

const DUMMY_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'John Doe', phone: '555-0101', address: '123 Main St, Springfield', balance_cents: 0 },
  { id: 'c2', name: 'Jane Smith', phone: '555-0102', address: '456 Elm St, Springfield', balance_cents: 15000 },
  { id: 'c3', name: 'Bob Johnson', phone: '555-0103', address: '789 Oak Ave, Springfield', balance_cents: 45000 },
]

export function CustomerDetail({ customerId }: { customerId: string }) {
  const customer = DUMMY_CUSTOMERS.find(c => c.id === customerId)
  
  if (!customer) {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100 min-h-screen p-4 items-center justify-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer not found</h2>
        <Link href="/customers" className="text-blue-600 font-bold">Go back</Link>
      </div>
    )
  }

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
            {/* Dummy History Items */}
            <div className="p-4 active:bg-gray-50">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-900">HVAC Repair</span>
                <span className="text-gray-500 text-sm font-medium">Oct 12, 2023</span>
              </div>
              <p className="text-[15px] text-gray-600 mb-3">Replaced contactor on AC unit. Tested cooling cycle.</p>
              <div className="flex space-x-2">
                 <span className="inline-flex items-center rounded-lg bg-green-50 border border-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Paid $250.00</span>
                 <span className="inline-flex items-center rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 text-center px-3">2 Photos</span>
              </div>
            </div>
            <div className="p-4 active:bg-gray-50">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-900">Annual Maintenance</span>
                <span className="text-gray-500 text-sm font-medium">Apr 04, 2023</span>
              </div>
              <p className="text-[15px] text-gray-600 mb-3">Filter change and system tune-up.</p>
              <div className="flex space-x-2">
                 <span className="inline-flex items-center rounded-lg bg-green-50 border border-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Paid $95.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
