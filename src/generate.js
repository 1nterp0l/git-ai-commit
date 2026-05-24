import * as ollama from './providers/ollama.js';
import * as openai from './providers/openai.js';
import * as anthropic from './providers/anthropic.js';

const PROVIDERS = { ollama, openai, anthropic };

const STYLE_INSTRUCTIONS = {
  conventional: 'Use Conventional Commits: type(scope): description. Types: feat, fix, docs, style, refactor, test, chore, perf. Subject ≤ 72 chars.',
  simple: 'Write a short clear commit message in plain English. Imperative mood. ≤ 72 chars.',
  detailed: 'Write: short subject (≤ 72 chars), blank line, then 2-4 bullet points explaining what changed and why.',
};

function buildPrompt(diff, { style, emoji }) {
  const styleNote = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.conventional;
  const emojiNote = emoji ? 'Start with a relevant emoji (✨ feat, 🐛 fix, 📝 docs, ♻️ refactor, 🚀 perf, 🔧 chore).' : '';

  return `You are an expert developer writing perfect git commit messages.
${styleNote}
${emojiNote}
Rules:
- Be specific about WHAT changed and WHY
- Never use vague words: "update", "changes", "misc", "various"
- Output ONLY the commit message, no explanation, no quotes, no markdown

Git diff:
${diff.slice(0, 4000)}`;
}

export async function generateSuggestions(diff, config) {
  const provider = PROVIDERS[config.provider];
  if (!provider) throw new Error(`Unknown provider: ${config.provider}`);

  const providerConfig = {
    model: config.model,
    host: config.ollama?.host,
  };

  const prompt = buildPrompt(diff, config);
  const count = config.count || 3;

  // Generate N suggestions in parallel
  const promises = Array.from({ length: count }, () =>
    provider.generate(prompt, providerConfig)
  );

  const results = await Promise.allSettled(promises);
  const successes = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  if (successes.length === 0) {
    const firstError = results.find(r => r.status === 'rejected');
    throw new Error(firstError?.reason?.message || 'All generation attempts failed');
  }

  // Deduplicate
  return [...new Set(successes)];
}

export function getProviderLabel(name) {
  return PROVIDERS[name]?.label() || name;
}
