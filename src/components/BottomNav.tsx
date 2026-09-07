'use client'
import { ClipboardList, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  
  // Hide on invoice page which is a focused task
  if (pathname.includes('/invoices/')) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <ClipboardList className={`w-6 h-6 ${pathname === '/' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] font-bold tracking-wide">JOBS</span>
        </Link>
        <Link 
          href="/customers" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/customers') ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Users className={`w-6 h-6 ${pathname.startsWith('/customers') ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] font-bold tracking-wide">CUSTOMERS</span>
        </Link>
      </div>
    </div>
  )
}
