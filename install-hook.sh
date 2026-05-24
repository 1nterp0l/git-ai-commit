#!/bin/sh
# install-hook.sh — Installs git-ai-commit as a prepare-commit-msg hook

HOOK_DIR="$(git rev-parse --git-dir 2>/dev/null)/hooks"

if [ ! -d "$HOOK_DIR" ]; then
  echo "❌  Not inside a git repository."
  exit 1
fi

HOOK_FILE="$HOOK_DIR/prepare-commit-msg"

cat > "$HOOK_FILE" << 'EOF'
#!/bin/sh
# git-ai-commit hook — skip for merges, amends, and squashes
COMMIT_SOURCE=$2
if [ -z "$COMMIT_SOURCE" ]; then
  git-ai-commit --yes
fi
EOF

chmod +x "$HOOK_FILE"
echo "✅  Hook installed: $HOOK_FILE"
echo "    git-ai-commit will now run automatically on every commit."
