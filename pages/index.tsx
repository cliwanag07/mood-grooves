import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
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

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Get Music'}
      </button>

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
    </main>
  );
}
