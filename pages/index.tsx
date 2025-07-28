import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [genres, setGenres] = useState<string[]>([]);

  const handleSubmit = async () => {
    const res = await fetch('/api/gemini/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();
    setGenres(data.tags || []);
  };

  return (
    <div className="p-4">
      <textarea
        placeholder="How are you feeling today?"
        className="w-full border p-2 mb-4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleSubmit}
      >
        Submit
      </button>

      {genres.length > 0 && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Suggested Genres:</h2>
          <ul className="list-disc ml-4">
            {genres.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
