import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import TTSGenerator from '@/app/components/TTSGenerator';
import AudioHistory from './history';
import STTRecorderClient from '@/app/components/STTRecorderClient';

async function DashboardHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Welcome, {user.email}!
      </h1>
      <p className="text-gray-600 mt-2">Manage your AI voices and conversations</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Suspense fallback={<div className="text-center mb-8 animate-pulse text-gray-500">Loading profile...</div>}>
        <DashboardHeader />
      </Suspense>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <TTSGenerator />
        </div>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <STTRecorderClient />
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Recording History</h2>
        <Suspense fallback={<div className="mt-8 text-gray-500">Retrieving your voice audit log...</div>}>
          <AudioHistory />
        </Suspense>
      </div>
    </div>
  );
}
