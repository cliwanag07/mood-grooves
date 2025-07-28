import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

let spotifyAccessToken: string | null = null;
let tokenExpiry = 0;

async function getSpotifyAccessToken() {
  if (spotifyAccessToken && Date.now() < tokenExpiry) return spotifyAccessToken;

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
    }
  );

  spotifyAccessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60_000;
  return spotifyAccessToken;
}

async function searchSpotifyTrack(title: string, artist?: string) {
  const token = await getSpotifyAccessToken();
  const query = artist ? `${title} ${artist}` : title;

  const response = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: query,
      type: 'track',
      limit: 1,
    },
  });

  const items = response.data.tracks.items;
  return items.length > 0 ? items[0].external_urls.spotify : null;
}

function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { tags } = req.body;
  if (!Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid "tags"' });
  }

  try {
    const allTracks: { name: string; artist: string }[] = [];

    // Get top tracks for each tag
    for (const tag of tags) {
      const { data } = await axios.get(`http://ws.audioscrobbler.com/2.0/`, {
        params: {
          method: 'tag.getTopTracks',
          tag,
          api_key: LASTFM_API_KEY,
          format: 'json',
          limit: 50,
        },
      });

      const tracks = data.tracks?.track ?? [];
      for (const track of tracks) {
        allTracks.push({ name: track.name, artist: track.artist.name });
      }
    }

    // Shuffle and deduplicate
    const seen = new Set();
    const shuffled = shuffle(allTracks).filter(({ name, artist }) => {
      const key = `${name.toLowerCase()}-${artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const results: string[] = [];

    for (const track of shuffled) {
      const url = await searchSpotifyTrack(track.name, track.artist);
      if (url) results.push(url);
      if (results.length >= 5) break;
    }

    return res.status(200).json({ tracks: results });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error fetching track recommendations:', err.message);
    } else {
      console.error('Error fetching track recommendations:', err);
    }
    return res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
}
