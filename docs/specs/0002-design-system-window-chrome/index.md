# 0002. Adopt a semantic token layer and one window chrome

**Date**: 2026-09-20
**Status**: Proposed

## Summary

Everything visual in the desktop gets a name: colour, type, spacing, radius, shadow, translucency and motion become tokens in the Tailwind theme, and components read those names instead of a palette value. Light and dark are then one swap of values rather than a second set of styles, and the mode is applied before the first paint so nothing flashes. The window frame (shell, title bar, traffic lights, content area) becomes one component every later window composes, and the menu bar moves onto the tokens to prove the whole thing on a surface that already exists. Contrast is checked by a test, so a wrong pair fails the build rather than shipping.

## Requirements

**User stories**:

- As a visitor, I want the desktop to look deliberate in either mode, so that it reads as one product instead of a light theme with a dark switch bolted on.
- As a visitor who uses a keyboard, I want a focus ring I can see on the wallpaper, on the translucent bar and inside a window, so that nothing is a dead end.
- As the engineer building the eighth of fifteen windows, I want one frame and a named set of tokens, so that a new window belongs without me inventing colours.
- As the engineer, I want the contrast bar checked by a test, so that a weak pair fails the build instead of reaching a recruiter.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 16 keeps the appearance menu in the bar, the explicit `system` choice and the live listener that follows a system change during a session. This spec resolves the mode once at startup and stores the preference the menu will write.
- Row 12 keeps the mobile shell. This spec fixes the numbers it will use (the target size, the compact breakpoint, the solid surface fallback).
- Rows 6 to 15 keep their windows. This spec ships the frame they compose and migrates the menu bar onto the tokens.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: `src/index.css` declares one token list in a single `@theme static` block, covering the six semantic colour families (background, surface, text, border, accent, status) plus the measure tokens (radius, shadow, blur, target size, fonts, easings) and the motion durations in a plain `:root` block beside it. The block is `static` on purpose: Tailwind drops a theme variable that no generated utility references, and two tokens here are read by a raw `var()` in author CSS (the base layer's ground colour and the ring's inner shadow), so without `static` those two resolve to nothing in the built stylesheet while the dev server looks fine. There is one layer of semantic tokens and its definitions hold the palette values; component markup reads the semantic names only. Every mode dependent token carries a light value and a dark value, and the dark values are applied from one `[data-theme="dark"]` block. `npx tsc -b` and `npm run build` pass.
- **AC-2**: A small script in `index.html` writes `data-theme` on the document element before the first paint, taking the saved preference from `localStorage` and falling back to the system setting. The attribute is always present and always `light` or `dark`. Changing the stored value and reloading switches every surface, and a visitor whose resolved mode is dark sees no light surface first.
- **AC-3**: `npm test` runs a suite that reads the token values out of `src/index.css`, computes the WCAG contrast ratio for every pair the app uses, and fails when a pair is under 4.5:1 for body text or under 3:1 for large text, borders, icons and focus rings, in both modes. A pair that sits on a translucent surface is composited first, over a worst case wallpaper colour held as a fixture for each mode, so the two glass pairs are checked against the darkest and the lightest tone rather than against white. Text tokens stay opaque, so only a background ever composites. Adding a pair that does not pass fails the suite.
- **AC-4**: Focus is drawn as a two layer ring from `--color-focus-inner` and `--color-focus-outer`, and it is visible on the wallpaper, on the translucent menu bar, on a light window body and on a dark window body. The implementation is fixed: an `outline` of 2px in `--color-focus-outer` with a 2px offset, plus a 2px `box-shadow` in `--color-focus-inner`. Every interactive control is keyboard reachable and shows the ring, and no rule removes an outline without supplying the ring in its place.
- **AC-5**: `Window` renders the frame (rounded shell, window shadow, a title bar holding the three lights, a `leading` slot, a `trailing` slot and a content slot) and `WindowControls` renders the three lights as buttons whose accessible names come from the window title. A light with no handler is `disabled` rather than dead. The frame sets neither `position` nor `z-index`, so stacking stays the window manager's business. Every later window composes this frame instead of rebuilding it.
- **AC-6**: The five interaction states exist once each, as the named utilities `interactive-hover`, `interactive-active`, `interactive-selected`, `interactive-disabled` and `interactive-focus` (the ring), built from tokens, and the menu bar, the desktop labels and the chrome use them rather than a one off class each.
- **AC-7**: The menu bar keeps its content (the logo, the three links, the four icons and the live clock) and renders from semantic tokens only. No palette family appears in its markup or in its rules, and it follows the mode.
- **AC-8**: `WALLPAPER` in the content layer declares three images at `/images/wallpaper.png` (light), `/images/wallpaper-dark.png` and `/images/wallpaper-compact.png`, in a strict schema registered in the development check. The base layer paints `background-color: var(--color-background)` and `background-image: var(--wallpaper-image)`, preferring `--wallpaper-image-compact` under the compact breakpoint. A missing or failed image still leaves the ground colour painting, and no wallpaper path is hardcoded in the stylesheet.
- **AC-9**: Durations and easings exist as tokens, and each has a reader: `readMotionToken` returns milliseconds and `readEaseToken` returns the easing string. Both read the computed value off the document element, so a duration inherits the reduced motion answer rather than the media query being checked a second time in script. Under `prefers-reduced-motion: reduce` every duration resolves to 0ms and `readMotionToken` therefore returns 0. These two are the only way a GSAP timeline gets its timing, and GSAP's seconds are derived from the milliseconds at the call site.
- **AC-10**: `design.md` at the repo root covers colour, type, spacing and window chrome: the token families and their names, the type scale with its three families, the spacing scale, the frame anatomy with its slots, the focus and state rules, and the rule that components read semantic tokens only.
- **AC-11**: A minimum target size token of 44px exists and the chrome uses it. Under the compact breakpoint (Tailwind's `sm`, 40rem) the translucent levels fall back to a solid surface token, and nothing scrolls sideways at 360px wide.
- **AC-12**: Under `forced-colors: active` the frame edge and the focus ring stay visible, drawn from system colours.
- **AC-13**: Georama, Roboto Mono and Great Vibes are served from the bundle with no request to a third party at runtime. Every font token declares a fallback stack (`Georama, system-ui, sans-serif`, `Roboto Mono, ui-monospace, monospace`, `Great Vibes, cursive`), and the swap they allow is the accepted answer rather than a preload, because Vite hashes those file names and a hand written `<link rel="preload">` cannot name them.

## Decision

**Chosen option**: Option 1: define the standard, ship the tokens and the chrome primitives, and enforce it with a test while new code complies from now on.

One layer of semantic tokens, whose definitions hold the palette values, declared with `@theme static` so nothing is pruned and one `[data-theme="dark"]` block can swap the values. Both sets of values ship now. The mode is resolved before paint. The window frame and its lights become components, and the menu bar moves onto the tokens as the proof surface. The contrast pairs are guarded by a Vitest suite.

**Implementation skills**: `accessibility-audit` (`accesslint/skills`, `.agents/skills/accessibility-audit/`) · `accessibility-scan` (`accesslint/skills`, `.agents/skills/accessibility-scan/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `vite` (`antfu/skills`, `.agents/skills/vite/`) · `gsap-core` (`greensock/gsap-skills`, `.agents/skills/gsap-core/`) · `illegal-states` (`.copilot/skills/illegal-states/`)

## Standard definition

**Canonical pattern**:

```css
/* static: every token ships, including the two only read by var() in author CSS. */
@theme static {
  --color-surface: #ffffff;
  --color-surface-paper: #ffffff;
  --color-surface-sunken: #f9fafb;
  --color-text: #1f2937;
  --color-text-muted: #5b6472;
  --color-focus-inner: #ffffff;
  --color-focus-outer: #1e3a8a;
  --radius-window: 0.75rem;
  --shadow-window: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --blur-chrome: 64px;
  --spacing-touch: 2.75rem;
}

/* Unlayered and after the Tailwind import, so it beats the theme layer. */
[data-theme="dark"] {
  --color-surface: rgb(30 30 32 / 0.88);
  --color-surface-sunken: rgb(24 24 27 / 0.9);
  --color-text: #f4f4f5;
  --color-text-muted: #a1a1aa;
  --color-focus-inner: #18181b;
  --color-focus-outer: #bfdbfe;
}

/* The ring, pinned. Forced colours strips the box shadow, so it is replaced there. */
@utility interactive-focus {
  @apply outline-2 outline-offset-2 outline-focus-outer;
  box-shadow: 0 0 0 2px var(--color-focus-inner);
}

@media (forced-colors: active) {
  .interactive-focus {
    outline-color: CanvasText;
    box-shadow: none;
  }
}

@utility glass-chrome {
  @apply bg-chrome backdrop-blur-chrome;
}
```

```tsx
/* A component reads names, never a palette value. */
<section className="bg-surface text-text rounded-window shadow-window glass-chrome">
```

**Replaces**:

- Palette families in component style: `bg-white` on every window body, `bg-gray-50` on the title bar and both sidebars, `text-gray-400` on the title, `border-gray-200` on the sidebar rule, `bg-blue-100 text-blue-700` on a selected row. None of these can follow a mode.
- Colours written as arbitrary literals where they repeat: `bg-[#ff6157]`, `bg-[#ffc030]`, `bg-[#2acb42]` on the three lights, `text-[#00A154]` in the terminal, `text-[#5f6266]` on the image title.
- One off focus: `nav button:focus-visible` is the only focus rule in the codebase, so the fourteen window classes have no focus state at all. Every control now gets the ring from the utility.
- Ad hoc depth and radius: `shadow-2xl drop-shadow-2xl` doubled on every window, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl` and `rounded-2xl` chosen per component.

**Enforcement**:

The contrast suite in `npm test` over an explicit pair list, the rule stated in `design.md`, and code review. The repo has ESLint but no rule reads class strings, so the test is the automated half.

**Rollout**:

New code complies from now on. The menu bar migrates in this feature, since it is the proof surface. The style rules for windows that do not exist yet stay in the stylesheet as the ported reference and are **not** migrated here: each window feature migrates its own when it lands, and the remainder are deleted once every window is built. They must not be copied as they stand, because they are palette based and light only. That debt is tracked in Follow-up and stated in `design.md`.

**Exceptions**:

- The three traffic light colours and the terminal green are literal values that do not change with the mode. They are named tokens, so the value is written once.
- `--color-surface-paper` is deliberately light in both modes, because a document window (the resume) is a page.
- `--color-desktop-text` is deliberately light in both modes, because a desktop label sits on a wallpaper and not on a surface. The label therefore always sits on `--color-scrim`, and the pair the suite checks is the label on that wash rather than the label on the wallpaper.
- The compact wallpaper is one image for both modes.

## Feature design

The template's data model and API headings are read here as the token model and the interface surface, since this feature's model is a set of named values rather than entities.

**Token model** (the confirmed target; the rest of the values are read off `designs/` as each pair is proven against the contrast suite):

| Family | Tokens | Note |
|---|---|---|
| background | `--color-background` (the ground behind the wallpaper, and the fallback when the image fails), `--color-scrim` (the wash behind a desktop label) | the scrim flips with the mode |
| surface | `--color-surface` (window body), `--color-surface-sunken` (a sidebar, a preview well, the dashed terminal block), `--color-surface-raised` (a control above the body), `--color-surface-paper` (a document window), `--color-chrome`, `--color-glass-panel`, `--color-glass-hover` (the three glass tints) | only the paper is fixed light; the rest follow the mode |
| text | `--color-text`, `--color-text-muted` (subtitle, placeholder, table header), `--color-text-subtle` (the lightest label), `--color-text-on-accent`, `--color-desktop-text` (a label on the wallpaper) | |
| border | `--color-border`, `--color-border-strong`, `--color-divider` (the dashed rule) | |
| accent | `--color-accent`, `--color-accent-quiet-bg` and `--color-accent-quiet-fg` (a selected sidebar row), `--color-link`, `--color-focus-inner`, `--color-focus-outer` | |
| status | `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-traffic-close`, `--color-traffic-minimise`, `--color-traffic-zoom` | the four lights and the terminal green are the same in both modes |

**Measure tokens**: `--radius-control`, `--radius-panel`, `--radius-window`, `--radius-dock` · `--shadow-window`, `--shadow-control` · `--blur-chrome`, `--blur-panel` · `--spacing-touch` (2.75rem / 44px) · `--font-georama`, `--font-roboto`, `--font-display` · `--ease-out`, `--ease-in-out` · and in a plain `:root` block, `--duration-fast`, `--duration-base`, `--duration-slow`.

The three translucent levels are named utilities rather than loose tokens, so the tint and the blur stay paired: `glass-chrome` (`--color-chrome` at `--blur-chrome`, the menu bar), `glass-panel` (`--color-glass-panel` at `--blur-panel`, the dock), `glass-hover` (`--color-glass-hover` at `--blur-panel`, a desktop label on hover). Each of the three colours is a token with its own light and dark value; the panel and hover tints reuse the chrome value unless the images say otherwise. Under the compact breakpoint one base layer rule swaps all three for `--color-surface` with no blur, because blur is the expensive part on a phone.

**Load bearing values pinned here**, because the ring and the ground colour are the two the suite cannot derive on its own: `--color-focus-outer` is `#1e3a8a` in light and `#bfdbfe` in dark, `--color-focus-inner` is the surface it sits on (`#ffffff` light, `#18181b` dark), `--color-background` is the average tone of that mode's wallpaper, `--color-text` is `#1f2937` light and `#f4f4f5` dark, and `--color-text-muted` is `#5b6472` light and `#a1a1aa` dark. Both text values are opaque, so the suite never has to composite a glyph.

**Where each token is declared**: `@theme static` for everything that should generate a utility (colour, font, spacing, radius, shadow, blur, breakpoint, easing). A plain `:root` block beside it for the durations, because CSS and GSAP both read them and there is no utility to generate. The `[data-theme="dark"]` block stays unlayered and after the Tailwind import, so it wins over the theme layer's `:root`.

**State transitions** (the appearance resolution):

| Stored preference | System setting | `data-theme` | Note |
|---|---|---|---|
| absent, or `system` | light | `light` | the default for a first visit |
| absent, or `system` | dark | `dark` | |
| `light` | any | `light` | the stored choice wins |
| `dark` | any | `dark` | |

The stored value is the preference, not the resolved mode, so a third value (`system`) is already representable when row 16 adds the menu. The key is `portfolio.appearance`. Only `light` and `dark` are ever written to the attribute.

**Interface surface**:

| Export | Module | Signature | Returns |
|---|---|---|---|
| `WALLPAPER` | `#content/theme` | constant, keyed by `WallpaperId` (`light`, `dark`, `compact`) | `Record<WallpaperId, Wallpaper>`, each entry `{ id, imageUrl }` |
| `APPEARANCE_STORAGE_KEY` | `#lib/appearance` | constant | `string`, the one literal that appears on both sides |
| `readPreference` | `#lib/appearance` | `(storage?: Storage)` | `AppearancePreference` (`light`, `dark`, `system`), `system` when absent or unreadable |
| `resolveMode` | `#lib/appearance` | `(preference, systemPrefersDark: boolean)` | `AppearanceMode` (`light`, `dark`), pure |
| `applyAppearance` | `#lib/appearance` | `(mode: AppearanceMode)` | `void`. The one side effect: writes `data-theme` and `--wallpaper-image` on the document element |
| `initAppearance` | `#lib/appearance` | `()` | `AppearanceMode`. Reads, resolves, applies. Called once from `main.tsx` before `createRoot` |
| `readMotionToken` | `#lib/motion` | `(name: MotionToken)` | `number` in milliseconds, 0 under reduced motion |
| `Window` | `#components/Window` | component, `WindowProps` | the frame: shell, title bar, lights, slots |
| `WindowControls` | `#components/WindowControls` | component, `WindowControlsProps` | the three lights as labelled buttons |

```ts
type WindowProps = {
  title: string
  children: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  onClose?: () => void
  onMinimise?: () => void
  onZoom?: () => void
  className?: string
}
```

A light with no handler renders `disabled`, so the desktop never presents a control that does nothing and the accessible tree says so. The three lights keep the same colour whether or not they are disabled, since the colour is a picture of a window rather than an expression of state.

**Value sourcing** (every value a criterion needs, and where it comes from):

| Action | Value produced or displayed | Source |
|---|---|---|
| The mode is resolved at startup | the saved preference | `localStorage` under `APPEARANCE_STORAGE_KEY`, absent means `system` |
| | the system setting | `window.matchMedia('(prefers-color-scheme: dark)')`, read by the small script in `index.html` |
| | the `data-theme` value | derived: `preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference` |
| | the wallpaper image | `#content/theme`, `WALLPAPER[mode].imageUrl`, written to `--wallpaper-image` |
| | the compact wallpaper | `WALLPAPER.compact.imageUrl`, written to `--wallpaper-image-compact` and preferred by the base layer media query |
| The menu bar renders | the clock time | `useCurrentMinute` in `Navbar.tsx`, the browser clock |
| | the link labels and icons | `#content/shell`, `NAV_LINKS` and `NAV_ICONS` |
| | the icon `alt` text | already in `#content/shell`, as the `label` every icon that acts carries. Wiring it into the markup is the desktop shell, row 6, not this feature |
| | every colour it paints | the semantic tokens, mode aware through `data-theme` |
| A window renders | the title | the `title` prop, supplied by the calling window's content |
| | the three accessible names | derived from the title, `` `Close ${title}` ``, `` `Minimise ${title}` ``, `` `Zoom ${title}` `` |
| | the frame colours, radius and shadow | `--color-surface`, `--color-border`, `--radius-window`, `--shadow-window` |
| | the light colours | `--color-traffic-close`, `--color-traffic-minimise`, `--color-traffic-zoom` |
| The contrast suite runs | the token values | parsed out of `src/index.css`, so the values are never retyped in the test |
| | the pairs to check | an explicit list in the test, each pair naming its two tokens and its foreground role |
| | the colour under a translucent pair | a worst case wallpaper fixture constant in the test, one per mode, with the darkest and lightest tones taken from the two wallpaper images |
| | the two new wallpaper files | `/images/wallpaper-dark.png` and `/images/wallpaper-compact.png`, which you produce from the designs. Light reuses the existing `/images/wallpaper.png` |
| A mode change is stored | the preference | written by `#lib/appearance`, read back on the next load |
| A GSAP timeline asks for timing | a duration | the computed CSS variable on the document element, read by `readMotionToken` |
| | an easing | the computed CSS variable on the document element, read by `readEaseToken`, with the milliseconds to seconds conversion at the call site |
| The first paint loads fonts | the three families and their fallback stacks | the font tokens in `@theme`, fed by the `@fontsource` packages |

**Key invariants**:

- Component markup reads semantic tokens only. A palette family appears only inside a token definition.
- Every mode dependent token has both values, and both are in the contrast pair list.
- Text tokens are opaque, so only a background is ever composited over a wallpaper fixture.
- `data-theme` is present and is `light` or `dark` from the first paint onward.
- A focused control always shows the ring. No rule removes an outline without supplying it.
- The frame sets neither `position` nor `z-index`.
- The target size token is the minimum for any control on a compact screen.
- Every duration resolves to 0ms under `prefers-reduced-motion: reduce`.

**Accessibility and privacy model**:

There is no server, no account and no personal data, so there is no authentication or authorization surface to design. The commitment is WCAG 2.2 AA for contrast and keyboard access, and the one thing stored in a visitor's browser is a non sensitive appearance preference. Images keep the accessible text the content layer already carries, and a decorative image stays decorative.

**Configuration required**:

None. No environment variable, no credential and no build time flag. `APPEARANCE_STORAGE_KEY` is a constant rather than configuration.

**Critical test scenarios** (each maps to a criterion above):

- Happy path, cold load with a dark system setting and nothing stored: `data-theme="dark"` before the first paint, the dark wallpaper variable set, and the menu bar painted in dark glass with both pairs passing, verifies **AC-2**, **AC-7**, **AC-8**.
- Happy path, a stored `light` preference with a dark system: the attribute stays `light`, verifies **AC-2**.
- Contrast: every pair in the list passes in both modes, and a deliberately weakened token fails the suite, verifies **AC-3**.
- Keyboard: tab through the menu bar and through a rendered `Window`, and the ring is visible on the bar and on the window body, verifies **AC-4**, **AC-5**, **AC-6**.
- Failure: the wallpaper path returns 404, and `--color-background` still paints with readable labels, verifies **AC-8**.
- Reduced motion: with `prefers-reduced-motion: reduce`, `readMotionToken('base')` returns 0 and `readEaseToken('out')` still returns a string, verifies **AC-9**.
- Forced colours: the frame edge and the focus ring remain visible, and the box shadow is replaced rather than simply stripped, verifies **AC-4**, **AC-12**.
- The pruned token trap: the built stylesheet contains `--color-background` and `--color-focus-inner`, verifies **AC-1**, **AC-8**. These two are read only through `var()` in author CSS, so without `@theme static` they are the pair that disappears in production while dev looks correct.
- Two places hold the same key: the literal in `index.html` and `APPEARANCE_STORAGE_KEY` are compared by a test, verifies **AC-2**.

## Build plan

Ordered as a Tracer Bullet: one thin thread from the token list through the mode resolution to a real surface and its proof, then each remaining strand thickened on top of a thread that already works end to end.

1. Declare the token skeleton in `src/index.css` as one `@theme static` block: the six families with light values, the measure tokens, and an empty `[data-theme="dark"]` block below the Tailwind import. Paint the base layer from `--color-background` and `--wallpaper-image`, satisfies **AC-1**, **AC-8**.
2. Add `src/content/theme.ts` with the three wallpaper paths, the `Wallpaper` shape and its schema in `#content/types`, and register it in the development check, satisfies **AC-8**.
3. Add `src/lib/appearance.ts` (the key, `readPreference`, `resolveMode`, `applyAppearance`, `initAppearance`), call it from `main.tsx` before `createRoot`, and add the small script to `index.html` with its storage read wrapped so an unreadable store falls back to the system setting, satisfies **AC-2**.
4. Move the menu bar onto the tokens, keeping its content, satisfies **AC-7**.
5. Write the contrast suite: the values read out of the stylesheet, an explicit pair list, and a composite helper for the pairs that sit on a translucent surface, checked against a worst case wallpaper fixture per mode. This closes the thread end to end (tokens, mode, a real surface, proof), satisfies **AC-3**, **AC-8**.
6. Fill in the dark value for every mode dependent token, starting from the six load bearing values pinned in the design section, and iterate with the suite from step 5 until every pair passes, satisfies **AC-1**, **AC-3**.
7. Add the `interactive-focus` ring utility and the four remaining state utilities, then apply them to the menu bar, satisfies **AC-4**, **AC-6**.
8. Build `Window` and `WindowControls`, satisfies **AC-5**.
9. Add the motion tokens, the reduced motion block, `readMotionToken` and `readEaseToken`, satisfies **AC-9**.
10. Install the `@fontsource` packages, add `--font-display`, the fallback stacks, and remove the Google Fonts import, satisfies **AC-13**.
11. Add the compact behaviour: the target size on the chrome, the solid surface fallback, and the compact wallpaper, satisfies **AC-11**.
12. Add the forced colours rules for the frame edge and the ring, including the box shadow replacement, satisfies **AC-4**, **AC-12**.
13. Write `design.md` with the four areas the scope asks for, plus the rule, the exception list and the note that the ported window classes are reference only and not yet migrated, satisfies **AC-10**.

## Consequences

**Positive**:

- One place changes a colour, and both modes follow.
- Every window built from here gets focus, hover and the frame for free, so the accessibility baseline is a default rather than a chore.
- The contrast bar is enforced by `npm test`, so it holds as the token list grows.
- The ported stylesheet stops being the source of truth and becomes reference material, which removes the arbitrary literals and the doubled shadows as windows land.

**Negative / tradeoffs**:

- More indirection than a palette class. A new component now needs a token decision before it can be styled, which is slower on the first day and consistent from the second.
- The token list is a new vocabulary to learn, and a name chosen badly is expensive to change once windows read it.
- The pair list in the contrast suite is maintained by hand. A new pair that nobody adds is a pair nobody checks.
- Three font families load instead of two, and self hosting adds two dependencies to keep current.
- The ported window classes stay palette based until their window lands, so the invariant is only true of the code that exists. That is tracked debt rather than a finished state.
- `@theme static` ships every token rather than only the referenced ones, so the stylesheet is slightly larger and an unused token is no longer invisible. That is the price of a token the base layer reads through `var()`.

**Neutral**:

- `data-theme` on the document element is new global state, and it is the one thing outside React that the whole UI depends on.
- The storage key appears in `index.html` and in `#lib/appearance`, held in step by a test, because a render blocking script cannot import a module.
- Nothing listens for a system change during a session until row 16, so a visitor who flips their system setting mid visit sees the old mode until they reload.
- The dock and the desktop labels get tokens here and are built by row 6, so their tokens sit unused until then. Tailwind drops unused theme entries from the build, which is expected.

## Follow-up

- [ ] The `accessibility-audit` and `accessibility-scan` skills are installed and relevant to every window from here, and their conventions are not yet in root `AGENTS.md` `## Agent skills`. They apply to every file, so they belong at root level.
- [ ] `tailwind-context-resolver-mcp` was chosen but not connected, and its publisher is unvetted. Read its source before connecting it, and connect it in your MCP settings, since connecting is a step only you can take.
- [ ] Row 16 adds the appearance menu, the explicit `system` choice and the live `matchMedia` listener. This spec resolves the mode once at startup only.
- [ ] The ported window classes that are not yet migrated: each window feature migrates its own rules when it builds, and what remains is deleted once every window is built.
- [ ] The compact wallpaper is one image for both modes. If the dark mobile look needs its own, add a fourth entry to the content shape.
- [ ] `/images/wallpaper-dark.png` and `/images/wallpaper-compact.png` are produced from the designs and are yours to make. The build cannot pass AC-8 without them.
- [ ] If a measurement ever shows the self hosted faces need a preload, a small Vite `transformIndexHtml` plugin can inject the two links, since the file names are hashed and cannot be written by hand.
- [ ] `docs/specs/0001-content-data-model.md` is the older single file version of the directory spec beside it and is untracked. Delete it, so the numbering has one shape per number.
- [ ] The `Resume` window is the reason `--color-surface-paper` exists. When row 10 builds it, confirm the paper surface is the right call rather than a light body in both modes.

## Rationale

The reasoning behind the standard, the options weighed, and the current state evidence are in [rationale.md](rationale.md).
