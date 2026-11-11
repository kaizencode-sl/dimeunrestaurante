# Project guide

Astro site with shadcn/ui, Tailwind and GSAP. Package manager: **pnpm**.

## Stack

- **Astro**: static-first. Prefer `.astro` components; use React islands (`client:*`) only where interactivity is needed.
- **shadcn/ui** (base, `maia` preset): add components with `pnpm dlx shadcn@latest add <component>`. Use the `shadcn` MCP to browse and install them.
- **Tailwind**: style with utilities and the theme's CSS variables. No hardcoded colors.
- **GSAP**: all animation. Respect `prefers-reduced-motion` (use `gsap.matchMedia()`).

## MCP servers (`.mcp.json`)

- `astro-docs`: check it before guessing Astro APIs.
- `shadcn`: search, view and install components.

## Skills: when to use which

- `impeccable`: design, critique, polish or audit any UI. Default choice for design work.
- `design-taste-frontend`: new landing pages or redesigns that must not look templated.
- `web-design-guidelines`: review UI code for accessibility and best practices before shipping.
- `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-utils`, `gsap-plugins`, `gsap-performance`: animation work. `gsap-react` / `gsap-frameworks` only apply inside React islands.

## Conventions

- Keep it simple: no abstractions, dependencies or config without a current need.
- Accessible by default: semantic HTML, visible focus, alt text, sufficient contrast.
- Verify UI changes in the browser (dev server: `pnpm dev`) before calling them done.
