import { NextRequest, NextResponse } from 'next/server';
import { searchSongsByTag } from '@/lib/lastfm';

// POST /api/music - Get music recommendations for a mood tag
export async function POST(req: NextRequest) {
  const { mood } = await req.json();
  if (!mood) {
    return NextResponse.json({ error: 'Missing mood tag' }, { status: 400 });
  }
  try {
    const tracks = await searchSongsByTag(mood);
    return NextResponse.json({ tracks });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch music recommendations' }, { status: 500 });
  }
} 