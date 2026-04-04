import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tts } from 'edge-tts';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const { text, voice = 'en-US-JennyNeural' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text too long (max 5000 chars)' }, { status: 400 });
    }

    // 3. Generate speech using Edge-TTS (free)
    const audioBuffer = await tts(text, { voice });

    // 4. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to save audio' }, { status: 500 });
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
      // Still return the URL even if DB save fails (audio is saved)
    }

    // 7. Return the audio URL
    return NextResponse.json({ 
      success: true, 
      audioUrl: publicUrl,
      message: 'Speech generated successfully'
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate speech. Please try again.' 
    }, { status: 500 });
  }
}
