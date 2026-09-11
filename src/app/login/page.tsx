import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  const handleLogin = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/')
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <div className="bg-white p-6 border-4 border-gray-900 shadow-[8px_8px_0_0_rgba(17,24,39,1)] w-full max-w-sm">
        <h1 className="text-4xl font-black text-gray-900 mb-8 text-center uppercase tracking-tighter">FIELDFLOW</h1>
        <form action={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-2">EMAIL</label>
            <input name="email" type="email" defaultValue="owner@fieldflow.com" className="w-full px-4 py-4 bg-gray-100 border-2 border-gray-300 rounded-none focus:outline-none focus:border-gray-900 text-lg font-bold transition-colors" required />
          </div>
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-2">PASSWORD</label>
            <input name="password" type="password" defaultValue="password123" className="w-full px-4 py-4 bg-gray-100 border-2 border-gray-300 rounded-none focus:outline-none focus:border-gray-900 text-lg font-bold transition-colors" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 border-4 border-blue-600 text-white rounded-none py-4 text-xl font-black uppercase tracking-widest active:bg-blue-700 active:border-blue-700 active:translate-y-1 transition-all">
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  )
}
