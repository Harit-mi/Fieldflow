'use client'

import { useState, useEffect } from 'react'
import { Job, JobStatus } from '@/types'
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { openDB } from 'idb'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_ORDER: JobStatus[] = ['Scheduled', 'En Route', 'In Progress', 'Complete', 'Paid']

export function JobBoard({ initialJobs }: { initialJobs: Job[] }) {
  console.log("JobBoard rendering! initialJobs:", initialJobs)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const supabase = createClient()

  // Initialize IndexedDB for offline queue
  const initDB = async () => {
    return openDB('fieldflow-sync', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        }
      },
    })
  }

  // Flush queue to Supabase
  const flushQueue = async () => {
    if (!navigator.onLine) return

    const db = await initDB()
    const tx = db.transaction('sync_queue', 'readwrite')
    const store = tx.objectStore('sync_queue')
    const allPending = await store.getAll()
    
    setPendingSyncCount(allPending.length)

    if (allPending.length === 0) return

    for (const item of allPending) {
      if (item.type === 'job_status_change') {
        const { error } = await supabase
          .from('jobs')
          .update({ status: item.payload.status })
          .eq('id', item.payload.jobId)

        if (!error) {
          // Record it in the remote sync_queue table for audit/sync history
          await supabase.from('sync_queue').insert({
            device_id: 'browser',
            entity_type: 'job',
            entity_id: item.payload.jobId,
            payload: { status: item.payload.status },
            synced_at: new Date().toISOString()
          })
          
          await db.delete('sync_queue', item.id)
        }
      }
    }

    const remaining = await db.getAll('sync_queue')
    setPendingSyncCount(remaining.length)
  }

  // Listen for online events to trigger flush
  useEffect(() => {
    window.addEventListener('online', flushQueue)
    
    // Check initial queue on load
    initDB().then(db => db.getAll('sync_queue')).then(items => {
      setPendingSyncCount(items.length)
      if (navigator.onLine && items.length > 0) flushQueue()
    })

    return () => window.removeEventListener('online', flushQueue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stats
  const jobsRemaining = jobs.filter(j => j.status !== 'Complete' && j.status !== 'Paid').length
  const unpaidTotal = jobs.filter(j => j.status === 'Complete').reduce((acc, j) => acc + (j.invoice_amount_cents || 0), 0)

  const advanceStatus = async (jobId: string, currentStatus: JobStatus) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    if (currentIndex < STATUS_ORDER.length - 1) {
      const nextStatus = STATUS_ORDER[currentIndex + 1]
      
      // 1. Optimistic update
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: nextStatus } : j))
      
      // 2. Queue local mutation
      const db = await initDB()
      await db.add('sync_queue', {
        type: 'job_status_change',
        payload: { jobId, status: nextStatus },
        created_at: Date.now()
      })
      
      setPendingSyncCount(prev => prev + 1)

      // 3. Attempt to flush immediately if online
      flushQueue()
    }
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
      {/* Massive Summary Strip */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="sticky top-0 z-10 bg-white border-b-4 border-gray-900 px-4 py-4 shadow-md flex justify-between items-end"
      >
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center leading-none">
            TODAY
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs">{jobsRemaining} JOBS LEFT</p>
          <AnimatePresence>
            {pendingSyncCount > 0 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-2 inline-flex items-center bg-amber-200 px-3 py-1 text-xs font-black text-amber-900"
              >
                {pendingSyncCount} OFFLINE EDITS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">UNPAID</p>
          <motion.p 
            key={unpaidTotal}
            initial={{ scale: 1.1, color: '#fca5a5' }}
            animate={{ scale: 1, color: '#dc2626' }}
            className="text-4xl font-black text-red-600 leading-none tracking-tighter"
          >
            ${(unpaidTotal / 100).toFixed(0)}
          </motion.p>
        </div>
      </motion.div>

      {/* Heavy-Duty Job List */}
      <div className="p-3 space-y-5 pb-28">
        {jobs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-gray-500 font-bold text-xl uppercase tracking-widest">
            No jobs today
          </motion.div>
        )}
        
        <AnimatePresence>
          {jobs.map((job, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, delay: index * 0.05 }}
              key={job.id} 
              className="bg-white shadow-sm border-2 border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gray-900 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{job.customer.name}</h2>
                  <div className="flex items-center text-gray-300 font-bold mt-1 text-sm uppercase tracking-wider">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {new Date(job.scheduled_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    <span className="mx-2">•</span>
                    {job.service_type}
                  </div>
                </div>
              </div>
                
              {/* Main Content Area */}
              <div className="p-4 border-b-2 border-gray-100">
                <a 
                  href={`maps://?q=${encodeURIComponent(job.customer.address)}`} 
                  className="flex items-center min-h-[64px] text-lg font-bold text-gray-800 active:bg-gray-100 p-2 -mx-2 rounded-lg transition-colors"
                >
                  <MapPin className="w-8 h-8 mr-3 shrink-0 text-blue-600" />
                  <span className="leading-tight">{job.customer.address}</span>
                </a>
                
                {job.notes && (
                  <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-sm font-bold text-yellow-900 uppercase tracking-widest mb-1">NOTES</p>
                    <p className="text-lg text-yellow-900 font-medium leading-tight">{job.notes}</p>
                  </div>
                )}
              </div>

              {/* Massive Action Buttons */}
              <div className="p-2 space-y-2 bg-gray-50">
                <AnimatePresence mode="popLayout">
                  {job.status === 'Complete' ? (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                      <Link href={`/invoices/${job.id}`} className="w-full flex items-center justify-center bg-blue-600 min-h-[80px] font-black text-2xl text-white uppercase tracking-tight active:bg-blue-700 rounded-none shadow-sm transition-colors">
                        COLLECT PAYMENT
                      </Link>
                    </motion.div>
                  ) : job.status === 'Paid' ? (
                    <motion.div 
                      key="paid"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full flex items-center justify-center bg-green-100 min-h-[80px] font-black text-2xl text-green-800 uppercase tracking-tight border-2 border-green-200"
                    >
                      <CheckCircle className="w-8 h-8 mr-2"/> FULLY PAID
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="actions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex space-x-2"
                    >
                      <motion.a 
                        whileTap={{ scale: 0.96 }}
                        href={`tel:${job.customer.phone}`}
                        className="flex-1 flex items-center justify-center bg-white border-2 border-gray-300 min-h-[80px] font-black text-lg text-gray-700 uppercase tracking-widest"
                      >
                        <Phone className="w-6 h-6 mr-2 text-gray-500" />
                        CALL
                      </motion.a>
                      <motion.button
                        layout
                        whileTap={{ scale: 0.96 }}
                        onClick={() => advanceStatus(job.id, job.status)}
                        className="flex-[2] flex items-center justify-center bg-gray-900 min-h-[80px] font-black text-xl text-white uppercase tracking-tight shadow-sm"
                      >
                        {job.status === 'Scheduled' ? 'START JOB' : 'FINISH JOB'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
