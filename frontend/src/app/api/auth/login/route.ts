import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID!,
    scope,
    redirect_uri: REDIRECT_URI!,
  });
  return NextResponse.redirect('https://accounts.spotify.com/authorize?' + params.toString());
} 