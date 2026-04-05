import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import TTSGenerator from '@/app/components/TTSGenerator';
import AudioHistory from './history';

const STTRecorder = dynamic(() => import('@/app/components/STTRecorder'), { ssr: false });

async function DashboardHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <h1 className="text-3xl font-bold text-center mb-8">
      Welcome, {user.email}!
    </h1>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div className="text-center mb-8">Loading...</div>}>
        <DashboardHeader />
      </Suspense>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <TTSGenerator />
        </div>
        <div>
          <STTRecorder />
        </div>
      </div>
      <Suspense fallback={<div className="mt-8">Loading history...</div>}>
        <AudioHistory />
      </Suspense>
    </div>
  );
}
