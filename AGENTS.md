# macOS Style Portfolio

A desktop style portfolio in the browser: menu bar, dock, draggable windows, animated surfaces. Front end only, no server and no database.

## Stack

- **Language / Runtime**: TypeScript 6 and React 19, in the browser only
- **Framework**: Vite 8 with the React plugin
- **Key dependencies**: Tailwind CSS 4 (imported in `src/index.css`), zod 4 (the content schemas in `src/content/types.ts`), the three faces served from the bundle through `@fontsource` (Georama, Roboto Mono, Great Vibes, so no request leaves the page for a font), GSAP 3 for animation (installed: the dock magnify and the window timelines), React DOM
- **Package manager**: npm
- **Reference build**: the JSMastery macOS portfolio tutorial, https://jsmastery.com/video-kit/6a15ea4e-dbf9-458c-9faa-3eb4c2b90b75

## Build approach

Tracer Bullet (one thin real thread through every layer first, then thicken it strand by strand).

## Commands

```bash
npm install      # install
npm run dev      # dev server
npm run build    # typecheck, then build
npm run preview  # serve the built app
npm run lint     # ESLint
npm run format   # Prettier (`npm run format:check` checks without writing)
npm test         # Vitest in jsdom, src/**/*.test.ts(x)
npm run test:watch # Vitest in watch mode, for local work
npm run test:e2e # Playwright in Chromium, on its own dev server
npx tsc -b       # typecheck only (`npm run typecheck`)
```

## Specs

Every spec is a directory under `docs/specs/`: an `index.md` (the build spec `/develop` reads), a `rationale.md` (the reasoning) and a `verify.md` (`/check verify` runs it). Scope lives in `docs/scope/`.

## Rules

- Functions are pure by default: same input, same output. Side effects (DOM work, animation, storage) live at the edges and stay explicit.
- Data is immutable: `const`, `readonly`, immutable updates. Module level values are constants only.
- Prefer small composed functions over classes and inheritance.
- Expected failures return a value (a discriminated result) rather than throwing. Keep one error handling pattern for the whole app.
- TypeScript is strict with no `any`.
- Named exports only, no default exports.
- Naming: `PascalCase` components, `camelCase` functions, `useSomething` hooks, `SCREAMING_SNAKE_CASE` constants, `SomethingProps` prop types.
- Document every exported function, component, and hook in one short comment: what it does, what it returns.
- Accessibility baseline on every control: keyboard reachable, visible focus ring, labels on icon buttons, `alt` text on images, WCAG AA contrast.
- File layout follows the aliases already in `vite.config.ts`: `#components`, `#content`, `#lib`, `#windows`, `#store`, `#hoc`, one job per folder. `jsconfig.json` and `tsconfig.app.json` already map `#*` onto `src/*`, so a new folder needs its `vite.config.ts` entry only.
- Design system: build all UI to `design.md` (colour, type, spacing, frame anatomy, states); token values live in CSS.
- Animation takes its timing from the CSS tokens through `readMotionToken` and `readEaseToken` (`#lib/motion`), never a literal duration, so reduced motion needs no second code path.
- One compact breakpoint, written once as `COMPACT_QUERY` (`(width < 40rem)`) in `#store/useWorkArea`, with `readCompactLayout()` for the value a render needs before its first render. No other module writes the number.

## Tooling

Installed and wired by the `/develop tooling` step.

- Lint and format: ESLint 10 (installed) plus Prettier, configured so the two do not fight. One pre commit hook runs lint, format, and typecheck on changed files.
- Tests: Vitest runs in jsdom over `src/**/*.test.ts(x)` (the content layer, the design tokens, and the components through React Testing Library) behind `npm test`, and Playwright covers the rendered desktop end to end behind `npm run test:e2e`.
- CI: one GitHub Actions job on push and pull request, running lint, format check, typecheck, tests, then the end to end suite.
- GSAP is installed (the dock magnify and the window timelines) and every animation is timed from the motion tokens.

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
- [shared-tooling-eslint-prettier](.agents/skills/shared-tooling-eslint-prettier/): `agents-inc/skills`, Prettier and ESLint kept from fighting (`eslint-config-prettier` in a flat config)
- [accessibility-scan](.agents/skills/accessibility-scan/): `accesslint/skills`, the automated rule engine over a live page (contrast, alt text, labels)
- [accessibility-inspect](.agents/skills/accessibility-inspect/): `accesslint/skills`, the hands on tier: keyboard, focus order, screen reader names, reflow, target size
- [accessibility-audit](.agents/skills/accessibility-audit/): `accesslint/skills`, a whole site WCAG 2.2 conformance audit across sampled pages
- [accessibility-fix](.agents/skills/accessibility-fix/): `accesslint/skills`, repair the violations a scan or an audit returns
- [accessibility-diff](.agents/skills/accessibility-diff/): `accesslint/skills`, diff a page's violations against a baseline, as a regression gate

MCP servers: Playwright MCP (recommended), Tailwind MCP server (recommended)
Declined: Tailwind layouts and animations (josiahsiegel), Advanced TypeScript types (wshobson/agents), Chrome DevTools MCP, Figma MCP, zod, vitest and Testing Library Agent Skills (declined at /sync)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

- [src/components/AGENTS.md](src/components/AGENTS.md): the shell, the window frame, the movement and the focus handoff
- [src/content/AGENTS.md](src/content/AGENTS.md): the typed content model, its schemas, its id unions, and the development check
- [src/lib/AGENTS.md](src/lib/AGENTS.md): the browser edges and the pure helpers behind them
- [src/store/AGENTS.md](src/store/AGENTS.md): the window manager, its pure reducer, its actions and the React edge that holds them
- [src/test/AGENTS.md](src/test/AGENTS.md): the shared test helpers and the setup file Vitest loads
- [src/windows/AGENTS.md](src/windows/AGENTS.md): the window body registry every window registers in
- [src/windows/gallery/AGENTS.md](src/windows/gallery/AGENTS.md): the photos window, its album state and its viewer
- [e2e/AGENTS.md](e2e/AGENTS.md): the Playwright suite, one spec per desktop surface

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
