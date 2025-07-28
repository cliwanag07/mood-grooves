const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export async function searchSongsByTag(tag: string) {
  if (!LASTFM_API_KEY) throw new Error('LASTFM_API_KEY not set');
  const url = `${LASTFM_API_URL}?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}&api_key=${LASTFM_API_KEY}&format=json&limit=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from Last.fm');
  const data = await res.json();
  return data.tracks?.track || [];
} 