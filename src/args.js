export function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-p': case '--provider': result.provider = args[++i]; break;
      case '-m': case '--model':    result.model = args[++i]; break;
      case '-s': case '--style':    result.style = args[++i]; break;
      case '-n': case '--count':    result.count = parseInt(args[++i], 10); break;
      case '-e': case '--emoji':    result.emoji = true; break;
      case '-y': case '--yes':      result.autoConfirm = true; break;
      case '-v': case '--verbose':  result.verbose = true; break;
      case '--config':              result._showConfig = true; break;
      case '-h': case '--help':     printHelp(); process.exit(0); break;
    }
  }

  return result;
}

function printHelp() {
  console.log(`
  git-ai-commit v2 — AI commit messages, locally or via API

  Usage: git-ai-commit [options]

  Provider:
    -p, --provider <name>   ollama | openai | anthropic   (default: ollama)
    -m, --model <name>      Model override

  Generation:
    -s, --style <style>     conventional | simple | detailed  (default: conventional)
    -n, --count <n>         Number of suggestions to generate  (default: 3)
    -e, --emoji             Add emoji prefix

  Behavior:
    -y, --yes               Auto-confirm first suggestion
    -v, --verbose           Show diff preview
        --config            Show current config path & values

  Examples:
    git-ai-commit
    git-ai-commit --provider openai --style detailed
    git-ai-commit --provider anthropic --emoji -y
    git-ai-commit -p ollama -m mistral -n 5
  `);
}
