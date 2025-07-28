import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    });

    // Returns new access token, and possibly a new refresh token
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Failed to refresh token:', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}
