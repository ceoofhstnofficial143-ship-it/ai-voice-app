'use client';

import dynamic from 'next/dynamic';

const STTRecorder = dynamic(() => import('./STTRecorder'), { ssr: false });

export default function STTRecorderClient({ onTranscription }: { onTranscription?: (text: string) => void }) {
  return <STTRecorder onTranscription={onTranscription} />;
}
