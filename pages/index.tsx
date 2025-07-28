import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type Track = {
  name: string;
  artist: string;
  url: string;
};

type HistoryEntry = {
  prompt: string;
  tags: string[];
  tracks: Track[];
  createdAt: string;
};

function extractSpotifyId(url: string) {
  // Example Spotify track URL formats:
  // https://open.spotify.com/track/{id}
  // https://open.spotify.com/track/{id}?si=xxxx
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : '';
}

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

  // Fetch user history
  const fetchHistory = async (spotifyId: string) => {
    const res = await fetch('/api/history/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyId }),
    });
    const data = await res.json();
    setHistory((data.entries as HistoryEntry[]) || []);
  };

  // Save entry to history
  const saveEntry = async (prompt: string, tags: string[], tracks: Track[]) => {
    if (!spotifyUser) return;
    await fetch('/api/history/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotifyId: spotifyUser.id,
        displayName: spotifyUser.display_name,
        prompt,
        tags,
        tracks,
      }),
    });
    fetchHistory(spotifyUser.id);
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
      // Save entry to DB if logged in
      if (spotifyUser && data.tags && data.tracks) {
        // Try to parse track info if available
        const trackObjs = (data.tracks as string[]).map((url: string, i: number) => {
          // If you have name/artist, use them; else fallback
          return { name: url, artist: '', url };
        });
        await saveEntry(prompt, data.tags, trackObjs);
      }
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
      // Save entry to DB if logged in
      if (spotifyUser && tags && data.tracks) {
        const trackObjs = (data.tracks as string[]).map((url: string, i: number) => {
          return { name: url, artist: '', url };
        });
        await saveEntry(prompt, tags, trackObjs);
      }
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

  // Fetch history on login
  useEffect(() => {
    if (spotifyUser) {
      fetchHistory(spotifyUser.id);
    } else {
      setHistory([]);
    }
  }, [spotifyUser]);

  // Delete a single entry
  const deleteEntry = async (createdAt: string) => {
    if (!spotifyUser) return;
    await fetch('/api/history/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyId: spotifyUser.id, createdAt }),
    });
    fetchHistory(spotifyUser.id);
  };

  // Delete all entries
  const deleteAllEntries = async () => {
    if (!spotifyUser) return;
    await fetch('/api/history/deleteAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyId: spotifyUser.id }),
    });
    fetchHistory(spotifyUser.id);
  };

  return (
    <main className="p-10 max-w-4xl mx-auto">
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
        <div className="mt-6 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">🎶 Tracks:</h2>
          <div className="flex flex-col gap-2">
            {tracks.map((track, i) => (
              <iframe
                key={i}
                src={`https://open.spotify.com/embed/track/${extractSpotifyId(track)}`}
                width="100%"
                height="80"
                frameBorder="0"
                allow="encrypted-media"
                allowTransparency
                title={`Spotify track embed ${i}`}
                style={{ borderRadius: '8px' }}
              ></iframe>
            ))}
          </div>
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
      {/* User History */}
      {spotifyUser && history.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold mb-2">Your History</h2>
          <div className="max-h-[400px] overflow-y-auto border rounded p-3 bg-gray-50 space-y-8">
            {history.map((entry, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 mb-1">{new Date(entry.createdAt).toLocaleString()}</div>
                  <button
                    onClick={() => deleteEntry(entry.createdAt)}
                    className="text-red-600 hover:underline text-xs ml-2"
                  >
                    Delete
                  </button>
                </div>
                <div className="font-semibold">Prompt:</div>
                <div className="mb-1">{entry.prompt}</div>
                <div className="font-semibold">Tags:</div>
                <div className="mb-1">{entry.tags && entry.tags.join(', ')}</div>
                <div className="font-semibold">Suggestions:</div>
                <div className="flex flex-col gap-2">
                  {entry.tracks && entry.tracks.map((track, i) => (
                    <iframe
                      key={i}
                      src={`https://open.spotify.com/embed/track/${extractSpotifyId(track.url)}`}
                      width="100%"
                      height="80"
                      frameBorder="0"
                      allow="encrypted-media"
                      allowTransparency
                      title={`Spotify track embed history ${idx}-${i}`}
                      style={{ borderRadius: '8px' }}
                    ></iframe>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={deleteAllEntries}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Delete All History
          </button>
        </div>
      )}
    </main>
  );
}
