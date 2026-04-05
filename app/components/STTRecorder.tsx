'use client';

import { useState, useEffect } from 'react';

export default function STTRecorder({ onTranscription }: { onTranscription?: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setError('');
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscription(currentText);
        
        if (finalTranscript && onTranscription) {
          onTranscription(finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else {
          setError('Speech recognition error. Please try again.');
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    } else {
      setError('Your browser does not support Speech Recognition. Please try Chrome, Edge, or Safari.');
    }
  }, [onTranscription]);

  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 text-gray-900 h-full">
      <h3 className="text-lg font-semibold mb-3">Speech to Text</h3>
      
      <div className="flex gap-3 mb-4">
        {!isRecording ? (
          <button
            onClick={toggleRecording}
            disabled={!recognition}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            🎙️ Start Speaking
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors animate-pulse font-medium flex items-center justify-center gap-2"
          >
             ⏹️ Stop Listening
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {transcription && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Transcription:</label>
          <div className="p-3 bg-white border rounded-md min-h-[120px] text-gray-800 shadow-sm transition-all duration-200">
            {transcription}
          </div>
        </div>
      )}

      {!recognition && !error && (
        <p className="text-[12px] text-gray-500 text-center">
          Initializing speech recognition...
        </p>
      )}
    </div>
  );
}
