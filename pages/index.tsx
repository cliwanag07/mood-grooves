import { useState } from "react";

export default function Home() {
  const [journal, setJournal] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMood(null);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMood(data.moodSummary);
    } catch (err) {
      setMood("Error fetching mood summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>MoodGrooves Journal</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={6}
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="Write your journal entry here..."
          style={{ width: "100%", padding: 10, fontSize: 16 }}
          required
        />
        <button type="submit" disabled={loading} style={{ marginTop: 10 }}>
          {loading ? "Analyzing..." : "Get Mood Summary"}
        </button>
      </form>

      {mood && (
        <section style={{ marginTop: 20 }}>
          <h2>Mood Summary</h2>
          <p>{mood}</p>
        </section>
      )}
    </main>
  );
}
