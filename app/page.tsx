import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [journal, setJournal] = useState("");
  const [result, setResult] = useState<{ summary: string; mood: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult({ summary: data.summary || "", mood: data.mood || "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>MoodGrooves Journal</h2>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 500 }}>
          <label htmlFor="journal">Write your journal entry:</label>
          <br />
          <textarea
            id="journal"
            value={journal}
            onChange={e => setJournal(e.target.value)}
            required
            style={{ width: "100%", minHeight: 100, marginBottom: 16 }}
          />
          <br />
          <button type="submit" disabled={loading} style={{ padding: "0.5rem 1.5rem" }}>
            {loading ? "Analyzing..." : "Analyze Mood"}
          </button>
        </form>
        {result && (
          <div style={{ marginTop: 24, padding: 16, background: "#e6f7ff", borderRadius: 6 }}>
            <strong>Summary:</strong> {result.summary}
            <br />
            <strong>Mood:</strong> {result.mood}
          </div>
        )}
        {error && <div style={{ color: "#c00", marginTop: 16 }}>{error}</div>}
      </main>
    </div>
  );
}
