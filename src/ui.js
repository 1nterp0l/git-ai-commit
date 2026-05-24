import kleur from 'kleur';
import * as readline from 'readline';

// ─── Spinner ────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text) {
  let i = 0;
  let interval;
  const isTTY = process.stdout.isTTY;

  return {
    start() {
      if (!isTTY) { process.stdout.write(text + '...\n'); return; }
      interval = setInterval(() => {
        process.stdout.write(`\r${kleur.cyan(SPINNER_FRAMES[i++ % SPINNER_FRAMES.length])} ${text}`);
      }, 80);
    },
    stop(finalText) {
      if (!isTTY) return;
      clearInterval(interval);
      process.stdout.write(`\r${kleur.green('✔')} ${finalText || text}\n`);
    },
    fail(finalText) {
      if (!isTTY) return;
      clearInterval(interval);
      process.stdout.write(`\r${kleur.red('✖')} ${finalText || text}\n`);
    },
  };
}

// ─── Selector ───────────────────────────────────────────────────────────────

export async function selectMessage(suggestions) {
  if (!process.stdout.isTTY) {
    // Non-interactive: just return the first
    console.log(suggestions[0]);
    return suggestions[0];
  }

  const items = [...suggestions, '✏️  Write my own', '🔄 Regenerate'];
  let selected = 0;

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  function render() {
    // Clear previous lines
    process.stdout.write('\x1B[?25l'); // hide cursor
    console.log('\n' + kleur.bold().white('  Pick a commit message:') + kleur.gray('  (↑↓ to move, Enter to confirm)\n'));

    items.forEach((item, i) => {
      const isSelected = i === selected;
      const isOption = i >= suggestions.length;

      if (isSelected) {
        if (isOption) {
          console.log(kleur.cyan('  › ') + kleur.cyan().bold(item));
        } else {
          console.log(kleur.cyan('  › ') + kleur.white().bold(formatMsg(item)));
        }
      } else {
        if (isOption) {
          console.log(kleur.gray('    ' + item));
        } else {
          console.log(kleur.gray('    ' + formatMsg(item)));
        }
      }
    });
    console.log('');
  }

  function clearRender() {
    // Move up and clear (items + header + spacing)
    const lines = items.length + 4;
    for (let i = 0; i < lines; i++) {
      process.stdout.write('\x1B[1A\x1B[2K');
    }
  }

  render();

  return new Promise((resolve) => {
    function onKeypress(str, key) {
      if (key.name === 'up') {
        selected = (selected - 1 + items.length) % items.length;
        clearRender();
        render();
      } else if (key.name === 'down') {
        selected = (selected + 1) % items.length;
        clearRender();
        render();
      } else if (key.name === 'return') {
        cleanup();
        process.stdout.write('\x1B[?25h'); // show cursor

        const choice = items[selected];
        if (choice === '🔄 Regenerate') {
          resolve({ action: 'regenerate' });
        } else if (choice === '✏️  Write my own') {
          resolve({ action: 'custom' });
        } else {
          resolve({ action: 'commit', message: suggestions[selected] });
        }
      } else if (key.ctrl && key.name === 'c') {
        cleanup();
        process.stdout.write('\x1B[?25h');
        process.exit(0);
      }
    }

    function cleanup() {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.on('keypress', onKeypress);
    process.stdin.resume();
  });
}

// ─── Prompt ─────────────────────────────────────────────────────────────────

export function promptInput(question, defaultValue = '') {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const display = defaultValue
      ? `${kleur.cyan('?')} ${question} ${kleur.gray(`(${defaultValue})`)} `
      : `${kleur.cyan('?')} ${question} `;
    rl.question(display, (answer) => { rl.close(); resolve(answer || defaultValue); });
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMsg(msg) {
  const lines = msg.split('\n');
  const subject = lines[0];
  const rest = lines.slice(1).join('\n').trim();
  if (!rest) return subject;
  return subject + kleur.gray(' (+body)');
}

export function printBanner(provider, model) {
  console.log('');
  console.log(
    kleur.bold().white('  git-ai-commit') +
    kleur.gray(' v2.0  ') +
    kleur.cyan(`${provider}`) +
    kleur.gray(' · ') +
    kleur.gray(model)
  );
  console.log(kleur.gray('  ' + '─'.repeat(40)));
  console.log('');
}

export function printCommitted(message) {
  console.log('');
  console.log(kleur.green('  ✔ Committed:') + ' ' + kleur.white().bold(message.split('\n')[0]));
  console.log('');
}

export function printError(msg) {
  console.error('\n' + kleur.red('  ✖ Error: ') + msg + '\n');
}
