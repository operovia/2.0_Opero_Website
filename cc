#!/usr/bin/env bash
set -e
TOOLS="$HOME/workspace/.claude-tools"
BIN="$TOOLS/claude"
export CLAUDE_CONFIG_DIR="$TOOLS/config"
export DISABLE_AUTOUPDATER=1
mkdir -p "$CLAUDE_CONFIG_DIR"

if [ ! -x "$BIN" ]; then
  echo "Installing Claude Code into workspace (one time)..."
  curl -fsSL https://claude.ai/install.sh | bash
  cp -L "$HOME/.local/bin/claude" "$BIN"
  chmod +x "$BIN"
fi

node -e "const fs=require('fs'),f=process.env.CLAUDE_CONFIG_DIR+'/.claude.json';let j={};try{j=JSON.parse(fs.readFileSync(f))}catch{};j.hasCompletedOnboarding=true;fs.writeFileSync(f,JSON.stringify(j,null,2))"

unset ANTHROPIC_API_KEY
exec "$BIN" "$@"
