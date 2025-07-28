import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
let lastfmTags: Set<string> = new Set();

// You can fetch and cache Last.fm tags periodically
async function fetchLastFmTags() {
  const { data } = await axios.get(`http://ws.audioscrobbler.com/2.0/`, {
    params: {
      method: 'tag.getTopTags',
      api_key: process.env.LASTFM_API_KEY!,
      format: 'json',
    },
  });

  type LastFmTag = { name: string; count: string; reach: string };

  lastfmTags = new Set(
    (data.toptags.tag as LastFmTag[]).map((t) =>
      t.name.toLowerCase().replace(/\s+/g, '-')
    )
  );

}
fetchLastFmTags(); // Initial load

function filterTags(output: string): string[] {
  const tokens = output
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'));
  return tokens.filter((tag) => lastfmTags.has(tag));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt } = req.body;

  try {
    const aiResponse = await axios.post(
      `${GEMINI_API_BASE_URL}/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Infer the user's emotion and recommend music genres based on this input: "${prompt}". Respond with a comma-separated list of genres.` }] }],
      }
    );

    const text = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tags = filterTags(text);
    res.status(200).json({ raw: text, tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Gemini response' });
  }
}
