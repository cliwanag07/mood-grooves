import axios from 'axios';
import { useEffect, useState } from 'react';

export default function Playlist() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [uris, setUris] = useState<string[]>([]); // Spotify track URIs
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse tokens from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const at = params.get('access_token');
    const rt = params.get('refresh_token');
    const exp = params.get('expires_in');

    if (at && rt && exp) {
      setAccessToken(at);
      setRefreshToken(rt);
      setExpiresIn(Number(exp));
      setExpiresAt(Date.now() + Number(exp) * 1000);

      // Save tokens to localStorage for persistence
      localStorage.setItem('spotify_access_token', at);
      localStorage.setItem('spotify_refresh_token', rt);
      localStorage.setItem('spotify_expires_at', (Date.now() + Number(exp) * 1000).toString());

      // Clean URL so tokens aren’t visible
      window.history.replaceState({}, document.title, '/playlist');
    } else {
      // Try to load from localStorage
      const savedAt = localStorage.getItem('spotify_access_token');
      const savedRt = localStorage.getItem('spotify_refresh_token');
      const savedExp = localStorage.getItem('spotify_expires_at');
      if (savedAt && savedRt && savedExp) {
        setAccessToken(savedAt);
        setRefreshToken(savedRt);
        setExpiresAt(Number(savedExp));
      }
    }
  }, []);

  // Refresh access token automatically if expired or near expiry
  useEffect(() => {
    if (!refreshToken) return;

    const now = Date.now();

    if (expiresAt && expiresAt - now < 60 * 1000) {
      // Token expires in less than 1 min, refresh it
      fetch('/api/spotify/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            setAccessToken(data.access_token);
            const newExpiresAt = Date.now() + data.expires_in * 1000;
            setExpiresAt(newExpiresAt);
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_expires_at', newExpiresAt.toString());
            if (data.refresh_token) {
              setRefreshToken(data.refresh_token);
              localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
          } else {
            setError('Failed to refresh token');
          }
        })
        .catch(() => setError('Failed to refresh token'));
    }
  }, [expiresAt, refreshToken]);

  // Save playlist function
  const savePlaylist = async () => {
    if (!accessToken || uris.length === 0) {
      setError('Missing access token or no tracks to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/spotify/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris, accessToken }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save playlist');

      setPlaylistUrl(data.playlistUrl);
    } catch (err: unknown) { // Explicitly type as unknown
      if (axios.isAxiosError(err)) {
          // This is an Axios error (e.g., from network request failures)
          setError(err.response?.data?.error || err.message || 'Failed to save playlist. Network error.');
          // You might want to log the full error for debugging in development
          console.error('Axios error during playlist save:', err);
      } else if (err instanceof Error) {
          // This is a standard JavaScript Error object
          setError(err.message || 'Failed to save playlist. An unexpected error occurred.');
          console.error('General error during playlist save:', err);
      } else {
          // This is some other unknown type of error (e.g., a string, number, or plain object thrown)
          setError('Failed to save playlist. An unknown error type occurred.');
          console.error('Unknown error type during playlist save:', err);
      }
  } finally {
      setLoading(false);
  }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Save Your Playlist</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <textarea
        placeholder="Enter Spotify track URIs (comma separated)"
        rows={3}
        className="w-full p-2 border rounded mb-4"
        value={uris.join(', ')}
        onChange={(e) => setUris(e.target.value.split(',').map((uri) => uri.trim()))}
      />

      <button
        disabled={loading || uris.length === 0 || !accessToken}
        onClick={savePlaylist}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Playlist'}
      </button>

      {playlistUrl && (
        <p className="mt-4">
          Playlist saved!{' '}
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            Open in Spotify
          </a>
        </p>
      )}
    </main>
  );
}
