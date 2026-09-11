'use client'
import { ClipboardList, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  
  // Hide on invoice page which is a focused task, and hide on login page
  if (pathname.includes('/invoices/') || pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-gray-200 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-50" aria-label="Bottom Navigation">
      <div className="flex justify-around items-center h-24 max-w-md mx-auto">
        <Link 
          href="/" 
          aria-current={pathname === '/' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === '/' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 active:bg-gray-100'}`}
        >
          <ClipboardList className={`w-8 h-8 ${pathname === '/' ? 'stroke-[3px]' : 'stroke-2'}`} aria-hidden="true" />
          <span className="text-xs font-black tracking-widest uppercase">JOBS</span>
        </Link>
        <div className="w-1 h-12 bg-gray-200 rounded-full" aria-hidden="true"></div>
        <Link 
          href="/customers" 
          aria-current={pathname.startsWith('/customers') ? 'page' : undefined}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname.startsWith('/customers') ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 active:bg-gray-100'}`}
        >
          <Users className={`w-8 h-8 ${pathname.startsWith('/customers') ? 'stroke-[3px]' : 'stroke-2'}`} aria-hidden="true" />
          <span className="text-xs font-black tracking-widest uppercase">CUSTOMERS</span>
        </Link>
      </div>
    </nav>
  )
}
