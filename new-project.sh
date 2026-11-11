#!/usr/bin/env bash
# Usage: ./new-project.sh   (run once, in a fresh repo created from this template)
# Scaffolds Astro + shadcn into this folder (named after it), keeps the skills/MCP config,
# and removes the template-only files.
set -euo pipefail

cd "$(dirname "$0")"
name="$(basename "$PWD")"
[ -e package.json ] && { echo "Already set up"; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

pnpm dlx shadcn@latest init -t astro -b base --no-monorepo -p maia -n "$name" --cwd "$tmp"

rm -f README.md CLAUDE.md LICENSE .claude/settings.json new-project.sh
rsync -a --ignore-existing --exclude .git "$tmp/$name/" ./

pnpm add gsap

echo "Done. Run /init in Claude Code to generate this project's CLAUDE.md."
