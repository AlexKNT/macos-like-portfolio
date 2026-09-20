# Verify: content window bodies · spec 0006 · created 2026-09-20

_Steps derived from spec 0006 (the umbrella and both children). `/check verify` runs these; `/test` locks the durable ones._

The standard is proved two ways: by a test over the window registry, and by driving the Skills window in the real desktop. Every step below runs against the real content layer, so nothing needs a fixture: the stack, the four locations and the sixteen files are already authored.

## Commands

- [ ] `npx tsc -b` → clean, with no `any`, `WindowStage` refuses a stage with no region name, and `WINDOW_BODIES` still covers every window id → umbrella AC-1, umbrella AC-3
- [ ] `npm run lint` → clean → umbrella AC-1
- [ ] `npm test` → the registry test walks every entry of `WINDOW_BODIES`, each renders against a bare `window` target for its own id with one stage and one non empty region name, and a body carrying a hand written colour or a palette utility fails the run → umbrella AC-1, umbrella AC-2, umbrella AC-3
- [ ] `npm test` → `copyText` returns `unsupported` with no clipboard present and `refused` when the write rejects, and never throws → umbrella AC-2
- [ ] `npm test` → `outcomeForRow` returns the outcome for the row that copied, `null` for every other row, and moves when a second name is copied → skills AC-3
- [ ] `npm test` → spec 0005's suites still pass, so moving the Finder, the text file body and the image file body onto the stage changed no behaviour → umbrella AC-1
- [ ] `npm run build` → succeeds, and `dist/assets/*.css` holds the utilities the skills window uses → skills AC-7
- [ ] `npm run test:e2e` → `e2e/skills.spec.ts` passes in Chromium → skills AC-1, skills AC-3, skills AC-8, skills AC-12
- [ ] read `src/windows/WindowStage.tsx` → the container, the one named region with `tabIndex={-1}`, the optional heading, the optional sidebar slot, one polite live region and the `regionRef` the body focuses through; no colour, space or duration that is not a token → umbrella AC-1
- [ ] search `src/windows/**` for `navigator.clipboard` → no hit, because the write lives in `src/lib/clipboard.ts` → umbrella AC-2
- [ ] search `src/windows/**` for `aria-live` → one hit, in `WindowStage.tsx`, and both a confirmation and a refusal reach it → umbrella AC-2
- [ ] search `src/windows/**` for `QuietLine` → every importer resolves to the shared module in `src/windows/`, and no window carries its own quiet styling → umbrella AC-2
- [ ] search `src/windows/**` for a hex colour (`#[0-9a-f]{3,6}`) → no hit in any window body → skills AC-6, skills AC-7
- [ ] search `src/index.css` for `#terminal` → no hit, and `design.md`'s reference only paragraph records that it retired → skills AC-7
- [ ] read `src/index.css` and `src/lib/motion.ts` → `--duration-stagger` appears in the token block and in the reduced motion zeroing, and the motion token union names `stagger` → skills AC-5
- [ ] read `src/windows/skills/skillsLines.ts` → the prompt line and the hint are literals there and nowhere else, and the content layer gains no entry for either → skills AC-10

## UI / manual

- [ ] `npm run dev`, press the dock button for Skills → the window opens showing the prompt line, six groups in `TECH_GROUPS` order and the copy hint → skills AC-1
- [ ] compare each group against `TECH_GROUPS` → the categories and the names match the content layer exactly, with no name retyped in a component → skills AC-1, skills AC-10
- [ ] press a name → the row shows the confirmation, and the clipboard holds that name (paste it somewhere to check) → skills AC-3
- [ ] press a name in another group → the first confirmation is gone and the new row shows it → skills AC-3
- [ ] press the same name twice → the confirmation stays where it is, with no flicker and no second announcement → skills AC-3
- [ ] block the clipboard (deny the permission, or drive it with the clipboard API removed) and press a name → that row shows the quiet line naming the item, the name stays selectable by hand, the refusal is announced once, and nothing throws → skills AC-4
- [ ] listen with a screen reader → the copy is announced once, after the press, and nothing else in the window announces → skills AC-3
- [ ] with the keyboard alone, Tab from the frame → every name is reachable in reading order, each carries the visible focus ring, and each is announced with what the press does (`Copy React.js`) → skills AC-2
- [ ] press a name with Enter → it copies, so the names are real buttons and not styled text → skills AC-2
- [ ] watch the window open → the stack prints line by line, and the last line lands in well under a second → skills AC-5
- [ ] select text with the pointer while the window is open → the whole stack is selectable, so the reveal never removed a word from the page → skills AC-5
- [ ] minimise the window, restore it from the dock → the stack is still printed and does not replay → skills AC-5
- [ ] set the OS to reduce motion, open the window → the stack is there at once, fully open, with no movement and no half masked line → skills AC-5, skills AC-7
- [ ] empty one group's `items` in `src/content/techStack.ts` by hand, reload → the category still prints with the quiet line under it instead of a gap, then restore the file → skills AC-9
- [ ] narrow the window below 40rem → each group stacks, with the category on its own line and the names under it → skills AC-8
- [ ] check the same window at 360px → nothing scrolls sideways, a long name wraps rather than clipping, and every name is at least 44px tall → skills AC-8
- [ ] make the stack taller than the window (add groups by hand, then restore) → the body scrolls inside the frame, prompt line and hint included, and nothing is clipped → skills AC-1
- [ ] open the window in dark mode → every surface, the divider, the mark and the muted lines read, and no colour is hardcoded → skills AC-6, skills AC-7
- [ ] check the mark before each category with a screen reader → it is not announced, and the category name is → skills AC-6
- [ ] walk the headings with a screen reader → each category is its own heading, so the six areas are navigable without stepping through every name → skills AC-6
- [ ] open the Skills window twice (dock press while it is open) → one window, focused, never a second → skills AC-1
- [ ] open the Finder, the text file window and the image window after the move onto the stage → each behaves exactly as spec 0005 verified: the place shows, the region is named, focus moves on a place change, and the two quiet states read → umbrella AC-1

## Values that could be invented

Every row of the spec's value sourcing tables, checked rather than assumed.

- [ ] the stage's region name in the skills window → compare against `WINDOWS.skills.title` → umbrella AC-1
- [ ] the groups, their order and their names → compare against `TECH_GROUPS` in declaration order, not alphabetical → skills AC-1
- [ ] an item's visible label → compare against the string the content holds, with no transformation → skills AC-1, skills AC-2
- [ ] an item's accessible name → compare against `Copy` plus the item string → skills AC-2
- [ ] the prompt line and the hint → compare against `skillsLines` and confirm no second copy of either exists → skills AC-10
- [ ] the category heading and the mark's glyph → confirm the heading level is the one this spec chose and the glyph comes from `skillsLines`, with both reading from the token layer → skills AC-6
- [ ] the confirmation and the failure line → compare against `copyLines`, and confirm no window writes its own wording → umbrella AC-2
- [ ] the row a confirmation appears on → copy a name in the third group and confirm no other row confirms → skills AC-3
- [ ] the announcement → read the stage's live region and confirm it carries the shared wording once per press → umbrella AC-2, skills AC-3
- [ ] the reveal's duration, stagger and easing → read the hook and confirm each comes from `readMotionToken` or `readEaseToken`, with no literal → skills AC-5
- [ ] the reveal's effect on the DOM → read the panel before the timeline runs and confirm every line is present, and confirm the clip is cleared when it ends → skills AC-5
- [ ] every colour, space, radius and duration → read the markup and confirm each class resolves to a token declared in `src/index.css`, and any new pair appears in `src/lib/tokens.test.ts` in both modes → skills AC-6, skills AC-7
- [ ] the mark's role → read the markup and confirm the mark is hidden from assistive tech while the category carries the meaning → skills AC-6
- [ ] the item's target size at a narrow width → read the computed height at 360px against `--spacing-touch` → skills AC-8

## Acceptance-criteria coverage

Umbrella (`index.md`):

- umbrella AC-1 → the typecheck and registry rows, the stage read, the move of the three bodies, and the manual pass over the Finder and the two file windows
- umbrella AC-2 → the quiet line search, the clipboard search, the live region search, the `copyText` unit rows and the copy wording comparisons
- umbrella AC-3 → the registry test row, and the hand written colour search
- umbrella AC-4 → every skills row below, since the child is what proves the standard

Skills window (`0006-skills-window.md`):

- skills AC-1 → the dock step, the `TECH_GROUPS` comparison, the scroll step and the second open step
- skills AC-2 → the keyboard walk, the Enter step and the accessible name comparison
- skills AC-3 → the three copy steps, the announcement step and the `outcomeForRow` unit row
- skills AC-4 → the blocked clipboard step
- skills AC-5 → the open, selection, restore and reduce motion steps, and the two reveal value rows
- skills AC-6 → the dark mode step, the mark and heading steps and the token comparison
- skills AC-7 → the build row, the hex colour search, the `#terminal` search and the pair row
- skills AC-8 → the compact and 360px steps, and the target size row
- skills AC-9 → the emptied group step
- skills AC-10 → the `skillsLines` read, the content comparison and the prompt line row
- skills AC-11 → the stage read and the registry test row
- skills AC-12 → the Playwright command row
