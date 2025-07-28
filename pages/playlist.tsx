import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  uri: string;
}

export default function PlaylistPage() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = router.query.access_token as string;

    if (token) {
      fetch('/api/spotify/top-tracks', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setTracks(data.items.slice(0, 5)); // Top 5
          }
        })
        .catch(err => console.error('Failed to fetch tracks', err));
    }
  }, [router.query.access_token]);

  const handleLogin = () => {
    window.location.href = '/api/spotify/auth';
  };

  return (
    <div className="min-h-screen p-4 bg-neutral-950 text-white">
      <h1 className="text-2xl font-bold mb-4">Your Top 5 Tracks</h1>
      {tracks.length === 0 ? (
        <button
          onClick={handleLogin}
          className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
        >
          Login with Spotify
        </button>
      ) : (
        <div className="grid gap-4">
          {tracks.map(track => (
            <iframe
              key={track.id}
              src={`https://open.spotify.com/embed/track/${track.id}`}
              width="100%"
              height="160"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          ))}
        </div>
      )}
    </div>
  );
}
