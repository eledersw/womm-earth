#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v npm >/dev/null 2>&1; then
  echo "Falta Node.js/npm. Instala Node.js 22 o superior." >&2
  exit 1
fi
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  echo "Este proyecto necesita Node.js 22 o superior." >&2
  exit 1
fi

if [[ ! -x .venv/bin/python ]]; then
  if command -v python3.12 >/dev/null 2>&1; then
    python_bin=python3.12
  elif command -v python3 >/dev/null 2>&1; then
    python_bin=python3
  else
    echo "Falta Python 3.12." >&2
    exit 1
  fi
  if ! "$python_bin" -c 'import sys; assert sys.version_info[:2] == (3, 12)' 2>/dev/null; then
    echo "Este proyecto necesita Python 3.12." >&2
    exit 1
  fi
  "$python_bin" -m venv .venv
fi

if ! .venv/bin/python -c 'import fastapi, numpy, scipy, uvicorn' 2>/dev/null; then
  .venv/bin/python -m pip install -r requirements.txt 'uvicorn[standard]'
fi
if [[ ! -x node_modules/.bin/next ]]; then
  npm ci
fi

export PATH="$PWD/.venv/bin:$PATH"
echo "Abre la dirección Local que muestre Next.js (normalmente http://localhost:3000). Ctrl+C detiene ambos servidores."
if [[ ! -s .env.local ]] || ! grep -q '^ANTHROPIC_API_KEY=.' .env.local; then
  echo "La explicación con IA requiere ANTHROPIC_API_KEY en .env.local; los cálculos funcionan sin ella."
fi
exec npm run dev
