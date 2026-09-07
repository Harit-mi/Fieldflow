'use client'

import { useState, useEffect } from 'react'
import { Job, JobStatus } from '@/types'
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { openDB } from 'idb'

const STATUS_ORDER: JobStatus[] = ['Scheduled', 'En Route', 'In Progress', 'Complete', 'Paid']

export function JobBoard({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
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
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100 min-h-screen">
      {/* Sticky Header / Summary Strip */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            Today&apos;s Jobs
            {pendingSyncCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200 animate-pulse">
                {pendingSyncCount} syncing
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 font-medium">{jobsRemaining} remaining</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Unpaid</p>
          <p className="text-lg font-bold text-gray-900">${(unpaidTotal / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Job List */}
      <div className="p-4 space-y-4 pb-24">
        {jobs.length === 0 && (
          <div className="text-center py-10 text-gray-500">No jobs found for today.</div>
        )}
        {jobs.map(job => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Job Header (Always visible) */}
            <div 
              className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{job.customer.name}</h2>
                <div className="flex items-center text-gray-500 text-sm font-medium whitespace-nowrap ml-2">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(job.scheduled_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="flex items-start text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2 shrink-0 text-blue-500 mt-0.5" />
                <a 
                  href={`maps://?q=${encodeURIComponent(job.customer.address)}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="text-[15px] leading-snug active:text-blue-700"
                >
                  {job.customer.address}
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                  {job.service_type}
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    advanceStatus(job.id, job.status)
                  }}
                  className={`
                    min-h-[48px] px-5 rounded-lg font-bold text-sm min-w-[140px] transition-colors flex items-center justify-center
                    ${job.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                      job.status === 'Complete' ? 'bg-green-600 text-white active:bg-green-700' :
                      'bg-gray-900 text-white active:bg-gray-800'}
                  `}
                  disabled={job.status === 'Paid'}
                >
                  {job.status === 'Paid' ? (
                    <><CheckCircle className="w-4 h-4 mr-1.5"/> Paid</>
                  ) : job.status === 'Complete' ? (
                    'Mark Paid'
                  ) : (
                    `Mark ${STATUS_ORDER[STATUS_ORDER.indexOf(job.status) + 1]}`
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedJobId === job.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notes</h3>
                  <p className="text-[15px] text-gray-800 leading-relaxed">{job.notes}</p>
                </div>
                
                <div className="flex space-x-3">
                  <a 
                    href={`tel:${job.customer.phone}`}
                    className="flex-1 flex items-center justify-center bg-white border border-gray-300 rounded-xl min-h-[48px] font-semibold text-gray-700 active:bg-gray-50"
                  >
                    <Phone className="w-5 h-5 mr-2 text-gray-500" />
                    Call
                  </a>
                  {job.status === 'Complete' && (
                    <a href={`/invoices/${job.id}`}
                      className="flex-1 flex items-center justify-center bg-blue-600 rounded-xl min-h-[48px] font-bold text-white active:bg-blue-700"
                    >
                      Collect Payment
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
