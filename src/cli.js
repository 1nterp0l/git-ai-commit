import { execSync } from 'child_process';
import { parseArgs } from './args.js';
import { loadConfig, getConfigPath } from './config.js';
import { generateSuggestions, getProviderLabel } from './generate.js';
import {
  createSpinner, selectMessage, promptInput,
  printBanner, printCommitted, printError
} from './ui.js';

export async function run() {
  const cliArgs = parseArgs();
  const config = loadConfig(cliArgs);

  // --config flag: show config info and exit
  if (cliArgs._showConfig) {
    console.log(`\nConfig file: ${getConfigPath()}\n`);
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  // Get staged diff
  let diff;
  try {
    diff = execSync('git diff --cached', { encoding: 'utf8' });
  } catch {
    printError('Not inside a git repository.');
    process.exit(1);
  }

  if (!diff.trim()) {
    printError('No staged changes found. Run `git add` first.');
    process.exit(1);
  }

  if (config.verbose) {
    const preview = diff.slice(0, 600);
    console.log('\n' + preview + (diff.length > 600 ? '\n...' : '') + '\n');
  }

  printBanner(getProviderLabel(config.provider), config.model);

  let suggestions;

  while (true) {
    const spinner = createSpinner(
      `Generating ${config.count} suggestion${config.count > 1 ? 's' : ''}…`
    );
    spinner.start();

    try {
      suggestions = await generateSuggestions(diff, config);
      spinner.stop(`Got ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}`);
    } catch (err) {
      spinner.fail('Generation failed');
      printError(err.message);
      if (config.provider === 'ollama') {
        console.error('  Make sure Ollama is running: https://ollama.com\n');
      }
      process.exit(1);
    }

    // Auto-confirm mode
    if (config.autoConfirm) {
      commit(suggestions[0]);
      printCommitted(suggestions[0]);
      return;
    }

    const result = await selectMessage(suggestions);

    if (result.action === 'regenerate') {
      continue; // loop again
    }

    if (result.action === 'custom') {
      const custom = await promptInput('Your commit message:');
      if (!custom.trim()) { console.log('Aborted.'); process.exit(0); }
      commit(custom.trim());
      printCommitted(custom.trim());
      return;
    }

    // result.action === 'commit'
    commit(result.message);
    printCommitted(result.message);
    return;
  }
}

function commit(message) {
  try {
    execSync(`git commit -m ${JSON.stringify(message)}`, { stdio: 'inherit' });
  } catch {
    printError('git commit failed.');
    process.exit(1);
  }
}
