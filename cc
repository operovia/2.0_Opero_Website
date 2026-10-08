#!/bin/bash
if [ ! -f "$HOME/.local/bin/claude" ]; then
  echo "Claude Code missing, reinstalling..."
  curl -fsSL https://claude.ai/install.sh | bash
fi
python3 -c "
import json, os
path = os.path.expanduser('~/.claude.json')
data = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            data = json.load(f)
    except Exception:
        data = {}
data['hasCompletedOnboarding'] = True
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
"
exec "$HOME/.local/bin/claude" "$@"
