# macOS Style Portfolio

A desktop style portfolio in the browser: menu bar, dock, draggable windows, animated surfaces. Front end only, no server and no database.

## Stack

- **Language / Runtime**: TypeScript 6 and React 19, in the browser only
- **Framework**: Vite 8 with the React plugin
- **Key dependencies**: Tailwind CSS 4 (imported in `src/index.css`), GSAP for animation (chosen, not installed yet), React DOM
- **Package manager**: npm
- **Reference build**: the JSMastery macOS portfolio tutorial, https://jsmastery.com/video-kit/6a15ea4e-dbf9-458c-9faa-3eb4c2b90b75

## Build approach

`<TBD, set by /scope>`

## Commands

```bash
npm install      # install
npm run dev      # dev server
npm run build    # typecheck, then build
npm run preview  # serve the built app
npm run lint     # ESLint
npx tsc -b       # typecheck only
```

## Specs

`docs/specs/NNNN-title.md` (none yet). Scope lives in `docs/scope/`.

## Rules

- Functions are pure by default: same input, same output. Side effects (DOM work, animation, storage) live at the edges and stay explicit.
- Data is immutable: `const`, `readonly`, immutable updates. Module level values are constants only.
- Prefer small composed functions over classes and inheritance.
- Expected failures return a value (a discriminated result) rather than throwing. Keep one error handling pattern for the whole app.
- TypeScript is strict with no `any`. `src/constants/index.js` becomes TypeScript the next time it is touched.
- Named exports only, no default exports.
- Naming: `PascalCase` components, `camelCase` functions, `useSomething` hooks, `SCREAMING_SNAKE_CASE` constants, `SomethingProps` prop types.
- Document every exported function, component, and hook in one short comment: what it does, what it returns.
- Accessibility baseline on every control: keyboard reachable, visible focus ring, labels on icon buttons, `alt` text on images, WCAG AA contrast.
- File layout follows the aliases already in `vite.config.ts`: `#components`, `#content`, `#lib`, `#windows`, `#store`, `#hoc`, one job per folder. Register any new alias in `jsconfig.json` too.

## Tooling

Chosen now, installed by the `/develop tooling` step.

- Lint and format: ESLint 10 (installed) plus Prettier, configured so the two do not fight. One pre commit hook runs lint, format, and typecheck on changed files.
- Tests: Vitest with React Testing Library for components and helpers, Playwright for the desktop flows.
- CI: one GitHub Actions job on push and pull request, running lint, typecheck, and tests.
- Not wired yet: `@tailwindcss/vite` is installed but absent from the plugin list in `vite.config.ts`, and GSAP is not installed.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone, conventional commit messages

## Agent skills

- [gsap-core](.agents/skills/gsap-core/): `greensock/gsap-skills`, tweens, easing, staggering, reduced motion
- [gsap-timeline](.agents/skills/gsap-timeline/): `greensock/gsap-skills`, sequencing, position parameter, playback
- [gsap-plugins](.agents/skills/gsap-plugins/): `greensock/gsap-skills`, plugin registration (Draggable, Flip, ScrollTo and friends)
- [gsap-react](.agents/skills/gsap-react/): `greensock/gsap-skills`, `useGSAP`, refs, cleanup on unmount
- [gsap-utils](.agents/skills/gsap-utils/): `greensock/gsap-skills`, clamp, mapRange, snap and other helpers
- [gsap-performance](.agents/skills/gsap-performance/): `greensock/gsap-skills`, transforms, batching, avoiding layout thrash
- [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/): `vercel-labs/agent-skills`, React performance and component patterns
- [vite](.agents/skills/vite/): `antfu/skills`, Vite config, plugins, build behaviour
- [playwright-best-practices](.agents/skills/playwright-best-practices/): `currents-dev/playwright-best-practices-skill`, end to end test structure

MCP servers: Playwright MCP (recommended), Tailwind MCP server (recommended)
Declined: Tailwind layouts and animations (josiahsiegel), Advanced TypeScript types (wshobson/agents), Chrome DevTools MCP, Figma MCP

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
