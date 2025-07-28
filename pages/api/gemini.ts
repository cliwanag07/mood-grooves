import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  moodSummary: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { journal } = req.body;

  // Dummy logic for mood summary (replace with actual Gemini API call)
  const moodSummary = journal
    ? "Your mood seems reflective and calm."
    : "No journal entry provided.";

  res.status(200).json({ moodSummary });
}
