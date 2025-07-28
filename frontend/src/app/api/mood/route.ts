import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import MoodEntry from '@/models/MoodEntry';

// POST /api/mood - Save a mood entry
export async function POST(req: NextRequest) {
  await connectToDatabase();
  const data = await req.json();
  try {
    const entry = await MoodEntry.create(data);
    return NextResponse.json(entry);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save mood entry' }, { status: 500 });
  }
}

// GET /api/mood?userId=... - Get all mood entries for a user
export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  try {
    const logs = await MoodEntry.find({ userId }).sort({ date: -1 });
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch mood logs' }, { status: 500 });
  }
} 