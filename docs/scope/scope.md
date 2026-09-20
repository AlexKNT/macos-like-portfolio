# Scope: macOS style portfolio

A desktop style portfolio in the browser: menu bar, dock, and draggable windows, with animated surfaces. Front end only, no server and no database. It is built for hiring managers and recruiters, who scan fast and want the projects, the resume, and an easy way to get in touch.

**Build approach:** Tracer Bullet (one thin real thread through every layer first, then thicken it strand by strand).
**Workflow:** Beta (after develop: check verify, then test). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (for example `· Alpha`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Project scaffold & build | Foundation | existing |
| 2 | Tailwind wiring & base styles | Foundation | in-progress |
| 3 | Coding standards & tooling | Foundation | in-progress |
| 4 | Content data model | Foundation | in-progress |
| 5 | Design system & window chrome | Foundation | planned |
| 6 | Desktop shell | Slice 1 | planned |
| 7 | Window manager | Slice 1 | planned |
| 8 | Projects window (Finder style) | Slice 1 | planned |
| 9 | Skills window (Terminal style) | Slice 2 | planned |
| 10 | Resume window | Slice 2 | planned |
| 11 | Contact window | Slice 2 | planned |
| 12 | Mobile app switcher shell | Slice 3 | planned |
| 13 | Gallery window (Photos style) | Slice 4 | planned |
| 14 | Articles window (Safari style) | Slice 4 | planned |
| 15 | Archive window (Trash style) | Slice 4 | planned |
| 16 | Light and dark appearance | Slice 5 | planned |
| 17 | Metadata & social cards | Slice 5 | planned |
| 18 | Sound effects | Slice 5 | planned |

## Foundations

### 1. Project scaffold & build · existing
Vite 8 with React 19 and TypeScript 6, plus the folder aliases every import uses. Already in place, nothing planned here. code in `package.json`, `vite.config.ts`, `jsconfig.json`

### 2. Tailwind wiring & base styles · in-progress
Tailwind 4 is installed and imported in the stylesheet, but it is missing from the plugin list, so the theme, the utilities, and the base layers do not compile yet. Every later window depends on this working.
**Done when:** the plugin is registered, the theme tokens and utilities compile, and the Vite starter page and its styles are gone.
- [x] Build it: `/develop tailwind wiring & base styles`
code in `vite.config.ts`, `src/index.css`, `src/components/Navbar.tsx`, `src/App.tsx`

### 3. Coding standards & tooling · in-progress
The conventions and the tooling choices are recorded in `AGENTS.md` from the earlier audit. What is left is the enforcement: the formatter, the pre commit hook, the test runners, and the CI job.
**Done when:** lint and format agree with each other, one pre commit hook runs lint, format, and typecheck on changed files, component and end to end tests run, and CI runs those checks on every push and pull request.
- [x] Capture conventions and tooling choices: `/audit`
- [ ] Build it: `/develop coding standards & tooling`
- [ ] Check it runs clean: `/test`

### 4. Content data model · in-progress
The seed data for the menu bar, the dock, projects, articles, the stack, socials, the gallery, and the window spots already exists in JavaScript and nothing reads it yet. Settling its final typed shape now keeps every window building on the same structure.
**Done when:** the data is TypeScript with no `any`, one registry says which window opens for each item, and leftover seed data is trimmed.
- [x] Design it (spec): `/architect content data model`
- [ ] Build it: `/develop content data model`
  - [ ] Content layer and the shell thread: the aliases, the Result type, zod, the id unions, the nine windows and the shell content, with `Navbar` repointed (AC-1, AC-3, AC-4, AC-9)
  - [ ] The Finder tree and the profile: the four file kinds, the locations and the projects, the profile and the socials (AC-2, AC-6, AC-9)
  - [ ] Opening an item: `findById` and `openTargetFor` (AC-4, AC-6)
  - [ ] The rest of the content: articles, the tech stack, the gallery (AC-1, AC-2, AC-5)
  - [ ] Authoring and proof: the accessibility text and links, the old seed deleted, the development check and the content tests (AC-7, AC-8, AC-10)
- [ ] Verify it: `/check verify content data model`
- [ ] Test it: `/test content data model`
spec [0001](../specs/0001-content-data-model.md)

### 5. Design system & window chrome · planned · needs a decision
Wallpaper, translucency, type scale, spacing, and the window frame (title bar, traffic lights, focus and hover states), so every window looks like it belongs to one desktop and meets the contrast bar.
**Done when:** the design notes cover color, type, spacing, and window chrome, and the base pieces handle focus and keyboard use.
- [ ] Design it (spec): `/architect design system & window chrome`

## Slice 1: The desktop that works
The walking skeleton: the shell, the window behavior, and one real window with real content. Everything after this thickens the same thread.

### 6. Desktop shell · planned · needs a decision
The menu bar, the dock, and the wallpaper: the first thing a visitor sees, and the frame every window sits in.
**Done when:** the menu bar shows the live time and the nav links, a dock icon opens its window, keyboard users can reach both, and the wallpaper fills the viewport at any size.
- [ ] Design it (spec): `/architect desktop shell`

### 7. Window manager · planned · needs a decision
The shared behavior for every window: focus and stacking order, dragging, minimize and maximize, and closing. This is the thread the whole desktop runs on, so it comes before any single window.
**Done when:** opening from the dock focuses the window, dragging moves it, the focused window sits above the rest, minimize and close animate, and each of those actions has a keyboard path.
- [ ] Design it (spec): `/architect window manager`

### 8. Projects window (Finder style) · planned · needs a decision
The centrepiece for recruiters: browse project folders, then open one to read what it is, what it does, and where to find it.
**Done when:** a visitor opens a project, reads its detail view, follows a live or source link, and sees sensible empty and missing states.
- [ ] Design it (spec): `/architect projects window`

## Slice 2: The content windows
One strand each, all end to end: the rest of the core windows a recruiter expects.

### 9. Skills window (Terminal style) · planned · needs a decision
Your stack printed in a terminal, grouped by area, so a recruiter can scan what you work with in a few seconds.
**Done when:** the window lists each category with its items, and the text is readable by a screen reader.
- [ ] Design it (spec): `/architect skills window`

### 10. Resume window · planned · needs a decision
Your resume, readable and downloadable inside the desktop, since recruiters look for it first.
**Done when:** a visitor can read the resume and download the file, and a missing file shows a clear message instead of a broken window.
- [ ] Design it (spec): `/architect resume window`

### 11. Contact window · planned · needs a decision
How to reach you with no server involved: a copy address button, a mail link, and your socials.
**Done when:** copy puts the address on the clipboard and confirms it, the mail link opens the visitor's mail app, and each social is a labelled link.
- [ ] Design it (spec): `/architect contact window`

## Slice 3: Small screens
The desktop does not fit on a phone, so the metaphor is reshaped rather than squeezed.

### 12. Mobile app switcher shell · planned · needs a decision
On a phone the menu bar and the dock become a compact switcher that opens one window at a time, filling the screen.
**Done when:** on a small screen one window fills the viewport, the switcher lists every window, and nothing scrolls sideways.
- [ ] Design it (spec): `/architect mobile app switcher shell`

## Slice 4: The extra windows
Kept for after the core windows, since the seed data for them is already waiting.

### 13. Gallery window (Photos style) · planned · needs a decision
Images with an album sidebar, for photos and visuals that do not belong in a project case study.
**Done when:** the sidebar filters the grid, images load lazily with alt text, and the layout holds at narrow widths.
- [ ] Design it (spec): `/architect gallery window`

### 14. Articles window (Safari style) · planned · needs a decision
A browser looking window that links out to posts you wrote elsewhere, so the writing still gets found.
**Done when:** the list shows a date and a title, each entry opens the post in a new tab, and the links read well to a screen reader.
- [ ] Design it (spec): `/architect articles window`

### 15. Archive window (Trash style) · planned · needs a decision
A playful window that opens leftover files, which is where the metaphor earns a smile.
**Done when:** the window opens the leftover items, a visitor can empty it without errors, and it looks fine when empty.
- [ ] Design it (spec): `/architect archive window`

## Slice 5: Polish and launch
The pass that makes the site worth sharing with a recruiter.

### 16. Light and dark appearance · planned · needs a decision
The mode control already sits in the menu bar data. A visitor's choice should stick between visits and follow their system setting by default.
**Done when:** the control switches every surface, the choice survives a reload, the system setting is the starting point, and contrast holds in both modes.
- [ ] Design it (spec): `/architect light and dark appearance`

### 17. Metadata & social cards · planned · Alpha
Title, description, a card image, and a favicon, so a link looks right the moment it is shared with a recruiter.
**Done when:** the title and the description are set, a shared link shows its card image, and the favicon and theme color render.
- [ ] Build it: `/develop metadata & social cards`

### 18. Sound effects · planned · needs a decision
Dock and window sounds that give the desktop its feel, with a mute control, because surprise audio annoys people.
**Done when:** open, close, minimize, and dock hover each make a sound, the mute control silences them and the choice persists, and nothing plays before the visitor interacts with the page.
- [ ] Design it (spec): `/architect sound effects`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Visitor analytics**: see which windows visitors open and which projects they read · needs a decision
- **A second language**: translate the desktop and add a language switch · needs a decision
- **Hosted contact form**: messages that arrive without the visitor's mail app · needs a decision
- **Writing here**: author posts in the site instead of linking out · needs a decision
- **Cookie notice**: only needed once tracking arrives with analytics · needs a decision

## Legend

**The decision box.** A feature that needs a decision carries exactly one sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box. A feature with no decision (a purely mechanical build) has a single `Build it` box instead.

**Feature lifecycle**: the scope updates as a feature moves. Each row below is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked, spec linked, `Build it: /develop <feature>` plus 2 to 5 milestones, and the tier's closing boxes (`Verify it` from Alpha up, `Test it` from Beta up, `Review it` and `Document it` at GA) |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one at a time, code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` and its milestones ticked, `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so), `/sync` reconciles | the boxes you ran are ticked, skipped ones marked skipped; the tier's last stage is the suggested point to call it done |
| `existing` | `/scope` on a brownfield repo | already there before this workflow, no task list, left alone by `/develop` and `/sync` |
| `dropped` | `/scope replan` | out of scope, kept for history |

- **Next step** is the first unticked box, always a command or a tracked milestone. The section order is the build order.
- **needs a decision** means run `/architect` first, otherwise go straight to `/develop`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec, not here**: this scope carries only the milestone rollup.
- **Workflow** (header line) is the project default for what runs after `/develop`: **Prototype** is nothing, **Alpha** is `/check verify`, **Beta** is `/check verify` then `/test`, **GA** adds a fresh model `/check review` then `/document`. A feature with its own tier tag does more or less than the default. A feature built on an unratified decision stays flagged, and that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`) appears only once those exist: the spec link comes from `/architect` at capture, the code path from `/develop`.
- **Accessibility is an acceptance criterion, not a separate feature**: every window is keyboard reachable, shows a visible focus ring, labels its icon buttons, gives images alt text, and holds WCAG AA contrast, per `AGENTS.md`.
