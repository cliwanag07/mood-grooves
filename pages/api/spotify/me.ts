import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Missing access token' });

  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { display_name, id } = response.data;
    res.status(200).json({ display_name, id });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(err.response?.data || err.message);
    } else if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error('Unknown error:', err);
    }
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
} 