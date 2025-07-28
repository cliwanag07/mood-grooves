import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Missing access token' });

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.status(200).json(response.data);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
}
