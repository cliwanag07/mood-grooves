import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios'; // Import AxiosError

const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
let lastfmTags: Set<string> = new Set();

// You can fetch and cache Last.fm tags periodically
async function fetchLastFmTags() {
  try {
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
    console.log('Last.fm tags fetched successfully.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // It's an Axios error (network error, HTTP error)
      console.error('Error fetching Last.fm tags (AxiosError):', error.message);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Last.fm Response Data:', error.response.data);
        console.error('Last.fm Status:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from Last.fm API.');
      }
    } else if (error instanceof Error) {
      // A general JavaScript error
      console.error('An unexpected error occurred while fetching Last.fm tags:', error.message);
    } else {
      console.error('An unknown error occurred while fetching Last.fm tags:', error);
    }
    // Decide how to handle this:
    // - You might want to throw the error to propagate it.
    // - You might want to log it and continue with an empty tag set (less ideal for accuracy).
    // For now, it just logs and `lastfmTags` will remain an empty set if the initial fetch fails.
  }
}
fetchLastFmTags(); // Initial load

function filterTags(output: string): string[] {
  const tokens = output
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'));
  return tokens.filter((tag) => lastfmTags.has(tag));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt" in request body.' });
  }

  try {
    const aiResponse = await axios.post(
      `${GEMINI_API_BASE_URL}/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Infer the user's emotion and recommend music genres based on this input: "${prompt}". Respond with a comma-separated list of genres.` }] }],
      }
    );

    // --- Specific error handling for Gemini API response ---

    // 1. Check for candidates
    const candidates = aiResponse.data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('Gemini API response did not contain any candidates.');
      // You might also check aiResponse.data.promptFeedback for reasons
      const promptFeedback = aiResponse.data.promptFeedback;
      if (promptFeedback && promptFeedback.blockReason) {
        console.error('Gemini API blocked response:', promptFeedback.blockReason, promptFeedback.safetyRatings);
        return res.status(400).json({ error: 'Gemini API blocked the response due to content policy.', details: promptFeedback.blockReason });
      }
      return res.status(500).json({ error: 'Gemini API did not generate a valid response.' });
    }

    // 2. Extract text and handle potential missing parts
    const text = candidates[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.error('Gemini API response candidate contained no text.');
      return res.status(500).json({ error: 'Gemini API generated an empty response.' });
    }

    const tags = filterTags(text);

    // Fetch tracks from the recommendations API
    const trackResponse = await axios.post(`${req.headers.origin}/api/recommendations`, { tags });
    const tracks = trackResponse.data.tracks;

    return res.status(200).json({ raw: text, tags, tracks });

  } catch (error) {
    // --- General error handling for the API call itself ---
    if (axios.isAxiosError(error)) {
      // This is an error from the Axios library, likely an HTTP error from the Gemini API
      const axiosError = error as AxiosError; // Type assertion for better IntelliSense
      console.error('Error calling Gemini API (AxiosError):', axiosError.message);

      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx (e.g., 400, 401, 403, 500 from Gemini)
        console.error('Gemini API Response Status:', axiosError.response.status);
        console.error('Gemini API Response Data:', axiosError.response.data);

        // You can be more specific here based on common Gemini API error codes
        if (axiosError.response.status === 400) {
          return res.status(400).json({ error: 'Bad request to Gemini API. Check your prompt or API key.', details: axiosError.response.data });
        } else if (axiosError.response.status === 401 || axiosError.response.status === 403) {
          return res.status(401).json({ error: 'Authentication/Authorization error with Gemini API. Check your API key.', details: axiosError.response.data });
        } else if (axiosError.response.status === 429) {
          return res.status(429).json({ error: 'Too many requests to Gemini API. Please try again later (rate limit).', details: axiosError.response.data });
        } else {
          return res.status(axiosError.response.status).json({ error: 'Gemini API returned an error.', details: axiosError.response.data });
        }
      } else if (axiosError.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an http.ClientRequest in node.js
        console.error('No response received from Gemini API.');
        return res.status(500).json({ error: 'No response from Gemini API. Network issue or API is down.' });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up Gemini API request:', axiosError.message);
        return res.status(500).json({ error: 'Failed to prepare request to Gemini API.' });
      }
    } else if (error instanceof Error) {
      // This catches any other JavaScript errors that are not Axios errors
      console.error('An unexpected non-Axios error occurred:', error.message);
      return res.status(500).json({ error: 'An unexpected server error occurred.', details: error.message });
    } else {
      // Fallback for truly unknown error types
      console.error('An unknown error occurred:', error);
      return res.status(500).json({ error: 'An unknown server error occurred.' });
    }
  }
}