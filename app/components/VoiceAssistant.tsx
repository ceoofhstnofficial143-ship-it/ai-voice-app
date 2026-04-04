'use client';

import { useState } from 'react';
import STTRecorder from './STTRecorder';
import TTSGenerator from './TTSGenerator';

export default function VoiceAssistant() {
  const [transcribedText, setTranscribedText] = useState('');

  return (
    <div className="space-y-6">
      <STTRecorder onTranscription={setTranscribedText} />
      
      {transcribedText && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">You said:</p>
          <p className="font-medium">{transcribedText}</p>
          <hr className="my-2 border-blue-200" />
          <TTSGenerator initialText={transcribedText} />
        </div>
      )}
    </div>
  );
}
