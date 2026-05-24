import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.git-ai-commit.json');

const DEFAULTS = {
  provider: 'ollama',
  model: null, // auto-picked per provider
  style: 'conventional',
  emoji: false,
  count: 3,
  autoConfirm: false,
  ollama: { host: 'http://localhost:11434' },
  openai: { model: 'gpt-4o-mini' },
  anthropic: { model: 'claude-haiku-4-5-20251001' },
};

const PROVIDER_DEFAULTS = {
  ollama: 'llama3',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
};

export function loadConfig(cliArgs = {}) {
  let fileConfig = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
      // ignore malformed config
    }
  }

  const merged = { ...DEFAULTS, ...fileConfig, ...cliArgs };

  // Auto-pick default model for provider if not set
  if (!merged.model) {
    merged.model = PROVIDER_DEFAULTS[merged.provider] || 'llama3';
  }

  return merged;
}

export function saveConfig(config) {
  const { provider, model, style, emoji, count, ollama, openai, anthropic } = config;
  writeFileSync(CONFIG_PATH, JSON.stringify({ provider, model, style, emoji, count, ollama, openai, anthropic }, null, 2));
}

export function getConfigPath() {
  return CONFIG_PATH;
}
