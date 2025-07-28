export async function createPlaylist(accessToken: string, userId: string, name: string, trackUris: string[]) {
  // Create playlist
  const playlistRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, public: false }),
  });
  if (!playlistRes.ok) throw new Error('Failed to create playlist');
  const playlist = await playlistRes.json();

  // Add tracks
  const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: trackUris }),
  });
  if (!addRes.ok) throw new Error('Failed to add tracks');
  return playlist;
} 