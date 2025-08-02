import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { requesterId, targetSpotifyId } = req.body;
  if (!requesterId || !targetSpotifyId) return res.status(400).json({ error: 'Missing fields' });
  await dbConnect();
  const requester = await User.findOne({ spotifyId: requesterId });
  if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findOne({ spotifyId: targetSpotifyId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.status(200).json({ entries: user.entries });
}