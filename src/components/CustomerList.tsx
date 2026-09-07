'use client'
import { useState } from 'react'
import { Customer } from '@/types'
import { Search, Phone, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function CustomerList({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [search, setSearch] = useState('')
  const filtered = initialCustomers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center mb-3">
          <Link href="/" className="p-2 -ml-2 text-gray-500 active:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-2">Customers</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl text-gray-900 placeholder-gray-500 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      
      <div className="p-4 space-y-3 pb-20">
        {filtered.map(c => (
          <Link key={c.id} href={`/customers/${c.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
              {c.balance_cents > 0 && (
                <span className="inline-flex items-center rounded-lg bg-red-50 border border-red-100 px-2.5 py-1 text-sm font-bold text-red-700">
                  Owes ${(c.balance_cents / 100).toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center text-gray-500 text-[15px] mb-1">
              <MapPin className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{c.address}</span>
            </div>
            <div className="flex items-center text-gray-500 text-[15px]">
              <Phone className="w-4 h-4 mr-2 shrink-0" />
              <span>{c.phone}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500">No customers found.</div>
        )}
      </div>
    </div>
  )
}
