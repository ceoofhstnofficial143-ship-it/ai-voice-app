'use client';

import { useState, useRef, useEffect } from 'react';
import { pipeline, AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

export default function STTRecorder({ onTranscription }: { onTranscription?: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriberRef = useRef<AutomaticSpeechRecognitionPipeline | null>(null);

  // Load Whisper model once when component mounts
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        // Using tiny model for speed (good balance of speed/accuracy)
        // Alternative: 'Xenova/whisper-base' for better accuracy (slower)
        const transcriber = await pipeline(
          'automatic-speech-recognition',
          'Xenova/whisper-tiny.en'
        );
        transcriberRef.current = transcriber;
        console.log('Whisper model loaded');
      } catch (err) {
        console.error('Failed to load Whisper model:', err);
        setError('Failed to load speech recognition model. Please refresh the page.');
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  const startRecording = async () => {
    setError('');
    setTranscription('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        // Stop all microphone tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!transcriberRef.current) {
      setError('Model not ready yet. Please wait.');
      return;
    }

    try {
      // Convert blob to URL and load as audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Wait for audio metadata to load
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', resolve);
      });

      // Transcribe
      const result = await transcriberRef.current(audioUrl);
      const transcribedText = result.text;
      
      setTranscription(transcribedText);
      if (onTranscription) {
        onTranscription(transcribedText);
      }
      
      URL.revokeObjectURL(audioUrl);
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 text-gray-900 h-full">
      <h3 className="text-lg font-semibold mb-3">Speech to Text</h3>
      
      {isModelLoading && (
        <div className="text-blue-600 mb-3 text-sm">
          Loading speech recognition model (once, ~5MB)... Please wait.
        </div>
      )}

      <div className="flex gap-3 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isModelLoading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🎙️ Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors animate-pulse"
          >
            ⏹️ Stop Recording
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
          <div className="p-3 bg-white border rounded-md min-h-[120px] text-gray-800">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
}
