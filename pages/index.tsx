import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [uris, setUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [spotifyUser, setSpotifyUser] = useState<{ display_name: string; id: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // On mount, check for access token in URL or localStorage
  useEffect(() => {
    // Check URL params
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const at = params.get('access_token');
    const rt = params.get('refresh_token');
    const exp = params.get('expires_in');
    if (at && rt && exp) {
      setAccessToken(at);
      localStorage.setItem('spotify_access_token', at);
      localStorage.setItem('spotify_refresh_token', rt);
      localStorage.setItem('spotify_expires_at', (Date.now() + Number(exp) * 1000).toString());
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    } else {
      // Try to load from localStorage
      const savedAt = localStorage.getItem('spotify_access_token');
      if (savedAt) setAccessToken(savedAt);
    }
  }, []);

  // When accessToken changes, fetch Spotify user info
  useEffect(() => {
    if (!accessToken) {
      setSpotifyUser(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/spotify/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });
        const data = await res.json();
        if (res.ok) {
          setSpotifyUser({ display_name: data.display_name, id: data.id });
        } else {
          setSpotifyUser(null);
        }
      } catch {
        setSpotifyUser(null);
      }
    })();
  }, [accessToken]);

  // Redirect to your backend auth endpoint for Spotify login
  const handleLogin = () => {
    window.location.href = '/api/spotify/auth';
  };

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
    if (uris.length === 0 || !accessToken) {
      setError('No tracks to save or not logged in');
      return;
    }
    setLoading(true);
    setError('');
    setPlaylistUrl('');
    try {
      const res = await fetch('/api/spotify/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris, accessToken }),
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
      <h1 className="text-2xl font-bold mb-4">🎵 Mood Grooves 🎵</h1>
      {/* Login or Welcome message under the main label */}
      <div className="mb-6">
        {spotifyUser ? (
          <span className="text-green-700 font-semibold">Welcome, {spotifyUser.display_name}!</span>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Login with Spotify
          </button>
        )}
      </div>
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
          disabled={loading || uris.length === 0 || !spotifyUser}
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
