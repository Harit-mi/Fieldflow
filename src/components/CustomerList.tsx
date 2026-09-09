'use client'
import { useState } from 'react'
import { Customer } from '@/types'
import { Search, Phone, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { motion, AnimatePresence } from 'framer-motion'

export function CustomerList({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [search, setSearch] = useState('')
  const filtered = initialCustomers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50 min-h-screen">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="sticky top-0 z-10 bg-white border-b-4 border-gray-900 px-4 py-4 shadow-md"
      >
        <div className="flex items-center mb-4">
          <Link href="/" className="p-2 -ml-2 text-gray-400 active:text-gray-900">
            <ArrowLeft className="w-8 h-8" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900 ml-2 uppercase tracking-tight">CUSTOMERS</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="SEARCH..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-100 border-2 border-gray-200 rounded-none text-xl font-bold text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500 outline-none uppercase tracking-widest"
          />
        </div>
      </motion.div>
      
      <div className="p-3 space-y-3 pb-28">
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-gray-500 font-bold text-xl uppercase tracking-widest">
            No customers found
          </motion.div>
        )}
        <AnimatePresence>
          {filtered.map((c, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, delay: i * 0.05 }}
              key={c.id}
            >
              <Link href={`/customers/${c.id}`} className="block bg-white shadow-sm border-2 border-gray-200 p-5 active:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{c.name}</h2>
                  {c.balance_cents > 0 && (
                    <span className="inline-flex items-center bg-red-100 border-2 border-red-200 px-3 py-1 text-sm font-black text-red-700 uppercase tracking-widest">
                      OWES ${(c.balance_cents / 100).toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col space-y-3 mt-4 text-lg font-bold text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 mr-3 shrink-0 text-gray-400" />
                    <span className="leading-tight">{c.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-6 h-6 mr-3 shrink-0 text-gray-400" />
                    <span>{c.phone}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
