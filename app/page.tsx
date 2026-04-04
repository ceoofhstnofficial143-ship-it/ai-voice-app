import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function AuthCheck() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }
  
  return null;
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>
      <h1 className="text-4xl font-bold mb-4">AI Voice App</h1>
      <p className="mb-4">Text to Speech & Speech to Text – free, no cost</p>
      <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        Get Started
      </a>
    </div>
  );
}
