export async function generate(prompt, { model, host = 'http://localhost:11434' }) {
  const response = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.message?.content?.trim() || '';
}

export function label() { return 'Ollama'; }
