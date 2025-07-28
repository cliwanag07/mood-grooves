import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { journal } = await req.json();
  if (!journal) {
    return NextResponse.json({ error: 'Missing journal entry' }, { status: 400 });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const prompt = `Summarize the following journal entry in one sentence and provide a single mood or emotion tag (e.g., "relaxed", "angry", "joyful"). Format: {\"summary\":\"...\", \"mood\":\"...\"}\n\nJournal: ${journal}`;

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{.*\}/s);
    if (match) {
      return NextResponse.json(JSON.parse(match[0]));
    }
    return NextResponse.json({ summary: text, mood: null });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to analyze mood' }, { status: 500 });
  }
} 