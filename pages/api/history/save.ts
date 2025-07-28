import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { spotifyId, displayName, prompt, tags, tracks } = req.body;
  if (!spotifyId || !prompt || !tags || !tracks) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await dbConnect();
  try {
    let user = await User.findOne({ spotifyId });
    const entry = { prompt, tags, tracks, createdAt: new Date() };
    if (user) {
      user.displayName = displayName || user.displayName;
      user.entries.unshift(entry);
      if (user.entries.length > 50) user.entries = user.entries.slice(0, 50);
      await user.save();
    } else {
      user = await User.create({ spotifyId, displayName, entries: [entry] });
    }
    res.status(200).json({ entries: user.entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save entry' });
  }
} 