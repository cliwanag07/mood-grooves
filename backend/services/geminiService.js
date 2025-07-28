const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function analyzeMood(journalText) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const prompt = `Summarize the following journal entry in one sentence and provide a single mood or emotion tag (e.g., "relaxed", "angry", "joyful"). Format: {\"summary\":\"...\", \"mood\":\"...\"}\n\nJournal: ${journalText}`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    // Gemini returns a nested structure; extract the text
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Try to parse the JSON from the response
    const match = text.match(/\{.*\}/s);
    if (match) {
      return JSON.parse(match[0]);
    }
    return { summary: text, mood: null };
  } catch (err) {
    console.error('Gemini API error:', err.message);
    throw err;
  }
}

module.exports = { analyzeMood };
