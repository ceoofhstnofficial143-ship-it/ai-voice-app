'use client';

import { useState, useEffect } from 'react';

export default function TTSGenerator({ initialText = '' }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [voice, setVoice] = useState('en-US-JennyNeural');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAudioUrl, setLastAudioUrl] = useState('');

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const voices = [
    { id: 'en-US-JennyNeural', name: 'Jenny (US Female)' },
    { id: 'en-US-GuyNeural', name: 'Guy (US Male)' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)' },
    { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)' },
    { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian Female)' },
    { id: 'en-IN-PrabhatNeural', name: 'Prabhat (Indian Male)' },
  ];

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setIsLoading(true);
    setError('');
    setLastAudioUrl('');

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      if (data.audioUrl) {
        setLastAudioUrl(data.audioUrl);
        // Play automatically
        const audio = new Audio(data.audioUrl);
        audio.play().catch(e => console.log('Autoplay blocked:', e));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md text-gray-900">
      <h2 className="text-2xl font-bold mb-4">Text to Speech Generator</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Voice</label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          {voices.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Text to Convert</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here..."
          rows={6}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <button
        onClick={generateSpeech}
        disabled={isLoading || !text.trim()}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating...' : 'Generate Speech'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {lastAudioUrl && !error && (
        <div className="mt-4 p-3 bg-green-100 rounded-md">
          <p className="text-green-700 mb-2">✅ Audio generated!</p>
          <audio controls src={lastAudioUrl} className="w-full" />
          <a
            href={lastAudioUrl}
            download="speech.mp3"
            className="inline-block mt-2 text-blue-600 hover:underline"
          >
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
}
