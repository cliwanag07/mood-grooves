import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const scope = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
}
