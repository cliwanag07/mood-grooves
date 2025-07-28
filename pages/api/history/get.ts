import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { spotifyId } = req.body;
  if (!spotifyId) return res.status(400).json({ error: 'Missing spotifyId' });
  await dbConnect();
  try {
    const user = await User.findOne({ spotifyId });
    if (!user) return res.status(200).json({ entries: [] });
    res.status(200).json({ entries: user.entries.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
} 