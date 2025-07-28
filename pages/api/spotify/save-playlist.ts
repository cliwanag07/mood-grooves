import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uris, accessToken } = req.body;
  if (!uris || !accessToken) return res.status(400).json({ error: 'Missing data' });

  try {
    // Get user ID
    const me = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = me.data.id;

    // Create playlist
    const playlist = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: 'Gemini Music Picks',
        description: 'Songs based on your mood',
        public: false,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Add tracks
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlist.data.id}/tracks`,
      { uris },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.status(200).json({ success: true, playlistUrl: playlist.data.external_urls.spotify });
  } catch (err: unknown) { // Explicitly type as unknown
    if (axios.isAxiosError(err)) {
        // This is an Axios error
        console.error(err.response?.data || err.message);
    } else if (err instanceof Error) {
        // This is a standard JavaScript Error object
        console.error(err.message);
    } else {
        // This is some other unknown type of error
        console.error('An unknown error occurred:', err);
    }
    res.status(500).json({ error: 'Failed to save playlist' });
  }
}
