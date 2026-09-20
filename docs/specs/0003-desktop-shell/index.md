# 0003. Adopt a desktop shell of menu bar, desktop surface and dock

**Date**: 2026-09-20
**Status**: In Progress

## Summary

The desktop becomes a real surface: one container between the menu bar and the bottom edge, holding the greeting, the project icons and every open window, with the bar and the dock painting above it. The bar's links and icons start doing what the content says they do, the dock opens windows and shows which ones are open, and all three entry points go through one window manager. A window that has no body yet opens a small placeholder, so the shell is usable today and each window feature replaces its own placeholder later.

## Requirements

**User stories**:

- As a recruiter landing on the page, I want to see a desktop that behaves like one, so that I trust the work before I read a word of it.
- As a visitor, I want a dock and desktop icons that open things, so that I can find the projects without guessing.
- As a keyboard user, I want every control in the bar, on the desktop and in the dock reachable and visibly focused, so that the desktop is operable without a pointer.
- As the engineer building window five of nine, I want the shell to hold no window logic, so that adding a window never means touching the desktop surface.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 7 (spec 0004) owns the window model and every window action. This feature builds the model and the three actions it needs to open, focus and close, and 0004 extends the same module.
- Rows 8 to 15 own their window bodies. This feature ships one placeholder body per window and each window feature deletes its own.
- Row 12 owns the compact switcher. This feature fixes what that switcher may assume: below the compact breakpoint the dock is not rendered, the desktop icons are the way in, and the focused window fills the work area.
- Row 16 owns the appearance menu, the explicit `system` choice, the stored preference and the live system listener.
- Row 18 owns sounds. This feature plays none.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The shell renders one desktop container that fills the space below the menu bar, holding the greeting, the desktop icons and the window layer. The menu bar and the dock paint above that container, so no window can cover either. The wallpaper comes from `WALLPAPER` in the content layer and fills the viewport at 320px wide and at 2560px wide with no sideways scroll, and the ground colour still paints when the image fails to load.
- **AC-2**: `PROFILE` gains a strict `greeting` object with a `lead` line and a `display` line, registered in the development check. The desktop renders both: the lead line in `--font-georama` at `text-4xl`, the display line in `--font-display` at `text-5xl`, both in `--color-desktop-text` and both on `--color-scrim` or the hover wash, never directly on the wallpaper. Both pairs join the contrast suite and hold 4.5:1 in both modes.
- **AC-3**: `DESKTOP_ITEMS` is a new strict content list, each item carrying an id, a label, an icon, a spot and an open target, with the three project folders and the resume as its four items. The folders carry `{ kind: 'project', projectId }` and the resume carries `{ kind: 'window', windowId: 'resume' }`. The four spots are `top-[5vh] left-5`, `top-[20vh] left-7`, `top-[33vh] left-7` and `top-[46vh] left-7`: a top and a left pair each, nothing anchored to a right edge, so every icon stays inside the left gutter and keeps working at 360px wide. The folder entries in `LOCATIONS` no longer carry `windowPosition`, which now lives only in this list. The shell renders one button per item at that item's spot, labelled by the item, with the focus ring and with the full name in its accessible name when the visible label clamps to two lines. Activating one calls the window manager's open action with that item's target and an opener of `desktop`.
- **AC-4**: Every menu bar control does what its content entry says. The three nav links open their window, the About icon opens the About location through the same open action, and the two decoration icons stay decorative with an empty `alt` and no interactive role. No control in the bar is pressable without an effect, and the live clock keeps working.
- **AC-5**: The appearance icon switches the resolved mode for the session: a press reads the mode the document is showing from `document.documentElement.dataset.theme`, applies its inverse with `applyAppearance`, and leaves storage alone. `readPreference` and `resolveMode` keep their existing job, which is the resolution at startup. Nothing is written to storage and no menu is rendered, because row 16 owns the menu, the explicit `system` choice, the stored preference and the live listener.
- **AC-6**: The dock is a labelled region holding the six `DOCK_APPS` as buttons in the content's order. Each button takes its accessible name from `DockApp.name`, its image from `WINDOWS[windowId].icon`, and shows the same name as a tooltip on hover and on focus. Each button lifts under the pointer. A button whose window is open shows an indicator, and the same indicator in a quieter form when its window is minimised. Every button is reachable by Tab and operable with Enter or Space.
- **AC-7**: With the pointer over the dock, the icons scale toward the pointer through GSAP on transform only, the neighbouring icons included, and every icon returns to its resting scale when the pointer leaves or the dock loses focus. The falloff is fixed: linear across the two nearest neighbours on each side, down to a scale of 1 for the icons beyond them, computed with `gsap.utils.mapRange` and `gsap.utils.clamp` rather than a number per icon. Under `prefers-reduced-motion: reduce` the magnify is not applied at all. The magnify never moves the dock panel, never changes layout, and never re renders the desktop.
- **AC-8**: Every entry point (a dock button, a menu bar link, a desktop icon) opens through the window manager's single open action, so activating an entry point whose window is already open focuses that window rather than opening a second. A window with no real body yet renders the placeholder body: the app's icon, the window name and one line naming what will live there, taken from a `WindowId` keyed map beside the placeholder. The placeholder is a normal window in every other respect, with the lights of the actions it offers.
- **AC-9**: Every control in the bar, on the desktop and in the dock is keyboard reachable in document order, shows the two layer focus ring spec 0002 defines, and is operable from the keyboard. The dock button's ring is added to the contrast suite as a pair on the translucent panel, which is the pair spec 0002 left open.
- **AC-10**: Below the compact breakpoint (Tailwind `sm`, 40rem) the dock is not rendered, the greeting and the desktop icons are, and nothing scrolls sideways at 360px wide. That absent dock is the seam row 12 builds its switcher on.
- **AC-11**: The shell holds no window state. No module under the shell's folders keeps a window list, a position or a stacking number, and every window change goes through a manager action. Removing the window layer leaves the bar, the desktop and the dock rendering on their own.

## Decision

**Chosen option**: Option 1, one desktop container with the chrome above it, three entry points through one open action, and a temporary placeholder body per window.

The desktop is a measured box between the menu bar and the bottom edge. The greeting, the desktop icons and the window layer live inside it, the bar and the dock paint above it, and the window manager owns everything about a window (spec 0004). The bar, the icons and the dock all call the same open action, and a window with no body yet renders a placeholder that is replaced window by window.

**Implementation skills**: `gsap-core` (`greensock/gsap-skills`, `.agents/skills/gsap-core/`) · `gsap-react` (`greensock/gsap-skills`, `.agents/skills/gsap-react/`) · `gsap-performance` (`greensock/gsap-skills`, `.agents/skills/gsap-performance/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `vite` (`antfu/skills`, `.agents/skills/vite/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`)

## Feature design

**Data model sketch**:

Three additions to the content layer, all strict and all registered in `src/content/validate.ts`.

| Entity | Fields | Notes |
|---|---|---|
| `DesktopItem` (new, `src/content/desktop.ts`) | `id: DesktopItemId` (key), `label: string`, `icon: string`, `position: string`, `target: OpenTarget` | Exactly four entries: the three project folders with `{ kind: 'project', projectId }` targets and the resume with `{ kind: 'window', windowId: 'resume' }`. `position` takes over the spots the folder entries used to carry (`top-[5vh] left-5`, `top-[20vh] left-7`, `top-[33vh] left-7`) and adds `top-[46vh] left-7` for the resume. Every spot is a top and left pair, and the array order is the tab order. |
| `Greeting` (new, inside `PROFILE`) | `lead: string`, `display: string` | Seeded as `Hey, welcome to my` and `portfolio`. Two fields, because the second is set in `--font-display` and the first is not. |
| `OpenTarget` (extended) | adds `{ kind: 'window'; windowId: WindowId }` | The resume desktop icon needs to name a window rather than a file, since `openTargetFor` sends a PDF out of the page. The four existing kinds stay as they are. |

`windowPosition` is removed from `projectFolderSchema` and from the three entries that carry it, because the spot now lives in `DESKTOP_ITEMS`. Nothing else in the tree changes.

**State transitions**:

No new state of its own. The shell reads two things and writes none: which dock buttons have an open window (from the manager's instances), and the resolved mode (from `applyAppearance`).

**API surface**:

The shell owns no interface of its own. Every control maps to a content entry and then to one manager action from spec 0004.

| Control | Content that drives it | Manager action |
|---|---|---|
| Dock button | `DOCK_APPS[i].windowId` | `open({ kind: 'window', windowId })` |
| Menu bar link | `NAV_LINKS[i].windowId` | `open({ kind: 'window', windowId })` |
| About icon | `NAV_ICONS` entry with an `openLocation` action | `open({ kind: 'location', locationId })` |
| Decoration icon | `NAV_ICONS` entry with a `decoration` action | none, and it renders no control |
| Desktop icon | `DESKTOP_ITEMS[i].target` | `open(target)` |
| Appearance icon | `NAV_ICONS` entry with an `appearance` action | none; it applies the mode itself |

**Value sourcing** (every value each action produces, computes or displays names where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| Render the greeting | the lead line and the display line | `PROFILE.greeting`, seeded in `src/content/profile.ts` |
| Render a desktop icon | the label, the image and the spot | the `DESKTOP_ITEMS` entry |
| Render a dock button | the accessible name and the tooltip | `DOCK_APPS[i].name` |
| Render a dock button | the image and the window it opens | `WINDOWS[windowId].icon`, and `DOCK_APPS[i].windowId` |
| Render a dock indicator | whether the window is open, and whether it is minimised | the manager's instances for that `windowId`, derived (spec 0004) |
| Magnify the dock | the scale for each icon and the pointer's offset from the dock centre | the magnify settings below: `--dock-magnify-scale` as the maximum, and the linear two neighbour falloff AC-7 fixes |
| Render a placeholder window | the one line naming what will live there | a `WindowId` keyed map beside the placeholder, thrown away window by window |
| Open from any entry point | the window id, the key and the title | the resolver in spec 0004 |
| Switch the appearance | the mode to apply | `readPreference` and `resolveMode` in `#lib/appearance`, then `applyAppearance` |
| Show the time | the formatted time and its `datetime` | the existing clock in `Navbar` |
| Fill the viewport | the wallpaper image | `WALLPAPER` in `#content/theme`, already applied before paint |
| Clamp a window | the work area | the desktop container's measured content box, minus the dock band |

**Key invariants**:

- Every control in the bar, the desktop and the dock has an effect or is not rendered as a control. A decoration icon renders no button.
- The shell reads the manager's state and never writes it, so no shell module holds a window list.
- The desktop container is the only element that defines the work area, so the manager has one box to clamp against.
- The dock band stays reserved at every width where the dock renders, so a window can never be covered by the dock.
- Every desktop spot is a top and left pair, so no icon depends on a right edge that a 360px screen does not have.

**Security model**:

None. The page is public, holds no personal data beyond the profile content already in the repo, stores nothing new (the appearance press is for the session only), and sends nothing anywhere.

**Configuration required**:

No environment variables and no new dependencies beyond GSAP, which this slice installs against the dependency already recorded as chosen in `AGENTS.md`. Three measure tokens join the token layer in `src/index.css`, since `design.md` says a value the tokens do not name is a gap to bring here:

- `--dock-clearance`: the band the dock reserves at the bottom of the work area, so the clamp keeps windows clear of it.
- `--dock-magnify-scale`: the largest scale an icon reaches toward the pointer.
- `--dock-hover-lift`: the small rise a dock button takes under the pointer.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: a click on the Portfolio dock button opens a window, it takes focus, its three lights work, and a second click on the same button focuses it rather than opening another, verifies **AC-6**, **AC-8**
- Keyboard path: Tab reaches every bar control, every desktop icon and every dock button in order, each shows the two layer ring, and Enter opens the focused app, verifies **AC-9**, **AC-4**, **AC-3**
- Failure case: a `DESKTOP_ITEMS` entry with a `window` target naming a window that has no placeholder and no body is rejected by the development check before the desktop paints, verifies **AC-3**, **AC-8**
- Failure case: with `prefers-reduced-motion: reduce` set, the dock magnify is not applied and the desktop still opens, focuses and closes windows, verifies **AC-7**
- Layout: at 360px wide the dock is absent, no sideways scroll appears, and the desktop icons still open their windows, verifies **AC-10**, **AC-3**
- Boundary: removing the window layer from the shell leaves the bar, the greeting, the icons and the dock rendering, verifies **AC-11**

## Build plan

Ordered as a Tracer Bullet: one thin thread through every layer (content, store, window layer, one real entry point) first, then thicken it strand by strand.

1. The content additions and their checks: `PROFILE.greeting`, `DESKTOP_ITEMS` with the four items, the `window` target on `OpenTarget`, the `windowPosition` removal, the schemas registered in `validate.ts`, and the content tests, satisfies **AC-2**, **AC-3**
2. The thin thread: the window model and the three actions this feature needs (open, focus, close) in `#store`, the window layer rendering instances through `Window`, and one placeholder body, proven end to end by one dock button, satisfies **AC-1**, **AC-8**, **AC-11**
3. The desktop surface: the container and the layering, the measured work area, the greeting and the desktop icons on the tokens, satisfies **AC-1**, **AC-2**, **AC-3**
4. The menu bar actions and the session appearance press, satisfies **AC-4**, **AC-5**
5. The dock: the labelled region, the six buttons, the tooltips, the lift, the indicators and the keyboard path, satisfies **AC-6**, **AC-9**
6. The dock magnify through GSAP, on transform only and off under reduced motion, satisfies **AC-7**
7. The placeholder bodies for all nine windows, the compact behaviour below the breakpoint, and the three new measure tokens, satisfies **AC-8**, **AC-10**
8. The dock ring pair added to the contrast suite, satisfies **AC-9**

## Consequences

**Positive**:

- Every entry point goes through one open action, so the desktop behaves the same whether a visitor clicks the dock, the bar or an icon.
- The work area is a measured box rather than a sum of chrome heights, so the clamp rule has one input and stays correct when the chrome changes.
- A placeholder body makes the shell verifiable today, and each window feature deletes one.
- The dock ring pair spec 0002 could not judge now has a control to judge it against.

**Negative / tradeoffs**:

- The placeholder bodies are throwaway work, nine of them, and they must not grow into real windows.
- The desktop icons and the greeting are content the desktop shows before any window opens, so the first impression depends on mostly static surfaces.
- The dock magnify is the one movement on the page a visitor did not ask for, so it is the first thing reduced motion removes.
- Between this feature and row 12, a phone gets a desktop with no dock. The icons are the way in until the switcher lands.

**Neutral**:

- GSAP arrives here, in a feature that uses it for one transform, rather than in the window manager, which uses it for timelines.
- `windowPosition` moves out of the folder schema, which is a small content model change to spec 0001's layer.

## Follow-up

- [ ] The `accessibility-*` skills and `illegal-states` are installed and used by these specs but are not yet listed in the `## Agent skills` section of `AGENTS.md`; `/sync` should add them (root `AGENTS.md`, since they apply to every UI file).
- [ ] `design.md` should gain the three new measure tokens and the desktop icon treatment (the two line clamp and the tooltip) when this feature lands.
- [ ] The profile's `greeting` copy is seeded from the reference build; the real wording is the engineer's to change, and changing it is a content edit, not a code change.

**Rationale, options and the design conversation**: see [rationale.md](rationale.md).
