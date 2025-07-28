import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [uris, setUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');

  // Submit prompt to Gemini API
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setPlaylistUrl('');
    try {
      const res = await fetch('/api/gemini/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setTags(data.tags || []);
      setTracks(data.tracks || []);
      setUris(data.uris || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh tracks with current tags
  const refreshTracks = async () => {
    if (tags.length === 0) return;
    setLoading(true);
    setError('');
    setPlaylistUrl('');
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      const data = await res.json();
      setTracks(data.tracks || []);
      setUris(data.uris || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to refresh tracks');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save tracks to Spotify playlist (calls your API)
  const saveToPlaylist = async () => {
    if (uris.length === 0) {
      setError('No tracks to save');
      return;
    }
    setLoading(true);
    setError('');
    setPlaylistUrl('');
    try {
      const res = await fetch('/api/spotify/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save playlist');

      setPlaylistUrl(data.playlistUrl);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save playlist');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎵 Gemini Music Recommender</h1>

      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={4}
        placeholder="How are you feeling today?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Get Music'}
        </button>

        <button
          onClick={refreshTracks}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || tags.length === 0}
        >
          Refresh Tracks
        </button>

        <button
          onClick={saveToPlaylist}
          className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || uris.length === 0}
        >
          Save to Playlist
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {tags.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold">🎧 Tags:</h2>
          <p>{tags.join(', ')}</p>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold">🎶 Tracks:</h2>
          <ul className="list-disc pl-6">
            {tracks.map((track, i) => (
              <li key={i}>
                <a href={track} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  {track}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {playlistUrl && (
        <div className="mt-6">
          <h2 className="font-semibold">✅ Playlist Created!</h2>
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 underline"
          >
            Open Spotify Playlist
          </a>
        </div>
      )}
    </main>
  );
}
