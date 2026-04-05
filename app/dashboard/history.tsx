import { createClient } from '@/lib/supabase/server';

export default async function AudioHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: entries, error } = await supabase
    .from('audio_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !entries || entries.length === 0) {
    return <p className="text-gray-500">No audio generated yet.</p>;
  }

  return (
    <div className="mt-8 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="border p-3 rounded-md">
            <p className="text-sm text-gray-600">
              {new Date(entry.created_at).toLocaleString()}
            </p>
            <p className="font-medium">Voice: {entry.voice}</p>
            <p className="text-gray-800 truncate">{entry.text.substring(0, 100)}...</p>
            <audio controls src={entry.audio_url} className="mt-2 w-full" />
          </div>
        ))}
    </div>
  );
}
