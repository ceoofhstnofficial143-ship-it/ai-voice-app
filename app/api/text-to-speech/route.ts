import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Max execution time for serverless (60s for Hobby)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error in TTS API:', authError);
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: authError?.message || 'No active session found' 
      }, { status: 401 });
    }

    // 2. Parse request body
    const { text, voice = 'en-US-JennyNeural' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    // 3. Generate speech using High-Reliability Google TTS Fallback
    // This bypasses Microsoft's 403 block on serverless IPs
    console.log(`Generating speech via Google Fallback for: ${text.substring(0, 50)}...`);
    
    // Google's public TTS endpoint is fast and extremely stable
    const truncatedText = text.substring(0, 200); // Safety limit
    const lang = voice.startsWith('en-GB') ? 'en-gb' : 'en-us';
    const googleTtsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(truncatedText)}&tl=${lang}&client=tw-ob`;

    const ttsResponse = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!ttsResponse.ok) {
      throw new Error(`Google TTS fetch failed: ${ttsResponse.statusText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // 4. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to save audio', 
        details: uploadError.message,
        hint: 'Make sure the "audio-files" bucket exists in Supabase and is Public.'
      }, { status: 500 });
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    // 6. Save metadata to database
    const { error: dbError } = await supabase
      .from('audio_entries')
      .insert({
        user_id: user.id,
        text: text,
        voice: voice,
        audio_url: publicUrl,
      });

    if (dbError) {
      console.error('DB error:', dbError);
    }

    // 7. Return the audio URL
    return NextResponse.json({ 
      success: true, 
      audioUrl: publicUrl,
      message: 'Speech generated successfully via fallback'
    });

  } catch (error: unknown) {
    console.error('TTS API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate speech. Please try again.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
