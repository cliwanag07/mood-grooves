import { useState } from "react";

const dummySpotifyTracks = [
  "3n3Ppam7vgaVa1iaRUc9Lp", // Example track IDs from Spotify
  "7ouMYWpwJ422jRcDASZB7P",
  "1lDWb6b6ieDQ2xT7ewTC3G",
  "2takcwOaAZWiXQijPHIx7B",
  "5ChkMS8OtdzJeqyybCc9R5",
];

export default function Home() {
  const [journal, setJournal] = useState("");
  const [loading, setLoading] = useState(false);
  const [moodSummary, setMoodSummary] = useState("");
  const [showTracks, setShowTracks] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!journal.trim()) return;

    setLoading(true);
    setShowTracks(false);
    setMoodSummary("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal }),
      });

      if (!res.ok) throw new Error("Failed to get mood");

      const data = await res.json();
      setMoodSummary(data.moodSummary || "Mood received!");
      setShowTracks(true);
    } catch (err) {
      setMoodSummary("Error fetching mood.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "Arial" }}>
      <h1>MoodGrooves Journal</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          rows={6}
          placeholder="Write your journal entry..."
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      {moodSummary && (
        <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{moodSummary}</p>
      )}

      {showTracks && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Top Tracks for You</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            {dummySpotifyTracks.map((id) => (
              <iframe
                key={id}
                src={`https://open.spotify.com/embed/track/${id}`}
                width="300"
                height="120"
                allow="encrypted-media"
                loading="lazy"
                style={{ borderRadius: 8 }}
                title={`Spotify Track ${id}`}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
