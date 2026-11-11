<div align="center">

# astro-shadcn-claude-starter

**A Claude Code starter for web projects.**
Astro + shadcn/ui + GSAP, with design skills and MCP servers preconfigured.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=black)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
![Claude Code](https://img.shields.io/badge/Claude_Code-D97757?logo=claude&logoColor=white)

<a href="#quick-start">Quick start</a> ·
<a href="#whats-included">What's included</a> ·
<a href="#how-it-works">How it works</a> ·
<a href="#customizing">Customizing</a>

</div>

---

## What is this?

A template repo, not a project. It holds the Claude Code setup I reuse on every web project — design skills, MCP servers, and project conventions — so a new site starts with all of it already in place instead of being rebuilt by hand.

Create a repo from this template, run one script, and it scaffolds Astro + shadcn in place around that setup.

## Quick start

Click **Use this template** on GitHub (or `gh repo create my-site --template OmarCaja/astro-shadcn-claude-starter --clone`), then:

```bash
cd my-site
./new-project.sh
```

The folder name becomes the project name. The script runs once: it deletes itself and the template-only files (`README.md`, `CLAUDE.md`, `LICENSE`, `.claude/settings.json`) and leaves you to commit the result.

## How it works

```mermaid
flowchart LR
    A["./new-project.sh"] --> B["shadcn init -t astro\n(in a temp dir)"]
    B --> C["merge into this folder\nremove template-only files"]
    C --> D["pnpm add gsap"]
    D --> E(("Ready project"))
```

Run `/init` inside the new project to generate its own `CLAUDE.md`.

## What's included

### MCP servers

| Server | Purpose |
| --- | --- |
| [`astro-docs`](https://mcp.docs.astro.build/mcp) | Up-to-date Astro documentation |
| [`shadcn`](https://ui.shadcn.com/docs/mcp) | Browse, search and install shadcn/ui components |

### Skills

| Skill | Source | Use for |
| --- | --- | --- |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) · [site](https://impeccable.style/) | Design, critique, polish and audit UI |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) · [site](https://www.tasteskill.dev/) | Landing pages that don't look templated |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Accessibility and UX review before shipping |
| `gsap-*` (8 skills) | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Core, timeline, ScrollTrigger, plugins, utils, performance, React, frameworks |

Skills live in `.agents/skills/` and are symlinked into `.claude/skills/`. Versions are pinned in `skills-lock.json`.

## Repo layout

```
.
├── .agents/skills/      # skill sources
├── .claude/skills/      # symlinks Claude Code reads
├── .claude/settings.json  # shellcheck hook for new-project.sh (template only)
├── .mcp.json            # MCP servers
├── CLAUDE.md            # this repo's own conventions (removed on setup)
├── skills-lock.json     # pinned skill versions
└── new-project.sh       # one-shot setup script (deletes itself)
```

## Requirements

[pnpm](https://pnpm.io), [Node.js](https://nodejs.org), `rsync`, and [Claude Code](https://claude.com/claude-code).

## Customizing

- **Fewer or different skills:** delete a skill's folder in `.agents/skills/` and its symlink in `.claude/skills/`, or add a new one the same way.
- **Different scaffold:** edit the `shadcn init` flags in [`new-project.sh`](new-project.sh).
- **Different stack notes:** edit [`CLAUDE.md`](CLAUDE.md) — it documents this template's own conventions; each generated project builds its own via `/init`.

## License

[MIT](LICENSE)
