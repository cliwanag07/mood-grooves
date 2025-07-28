import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

// Define the entry type for clarity
interface Entry {
  prompt: string;
  tags: string[];
  tracks: Array<{ name: string; artist: string; url: string }>;
  createdAt: Date | string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { spotifyId, createdAt } = req.body;
  if (!spotifyId || !createdAt) return res.status(400).json({ error: 'Missing required fields' });
  await dbConnect();
  try {
    const user = await User.findOne({ spotifyId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.entries = user.entries.filter(
      (entry: Entry) => new Date(entry.createdAt).getTime() !== new Date(createdAt).getTime()
    );
    await user.save();
    res.status(200).json({ entries: user.entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
}