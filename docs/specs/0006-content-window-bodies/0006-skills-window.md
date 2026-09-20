# The Skills window

_Part of spec [0006](index.md). The first body built to [the window body standard](0006-window-body-standard.md), which is also where the shared pieces land._

## Summary

The Skills window prints the stack in a terminal: a prompt line, one row per stack area with its names, and a line saying that pressing a name copies it. A press copies that name and confirms it on the row. The whole stack is in the page from the first paint, so the reveal that prints it line by line never hides a word from a screen reader, a selection or a test. It is scope row 9, and it is the window that proves the standard.

## Requirements

**User stories**:

- As a recruiter, I want to scan what this person works with in a few seconds, so that I can tell whether the stack matches the role.
- As a visitor, I want to take one name away without selecting it by hand, so that comparing the stack against a job description is quick.
- As a keyboard or screen reader user, I want the stack read as named things with one clear action each, so that nothing about the window depends on seeing a terminal.

**Scope boundaries**:

- The window manager is spec 0004's and does not change: the window opens through the existing action, and dragging, minimising, zooming and closing are unchanged.
- No search, no filter, no sorting control, no download. The window prints what the content layer holds.
- The stack is not editable and not measured: no level, no years, no per item note.
- No sound (row 18), and no typing on any window other than this one.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The window opens from the dock button and shows the prompt line, the six groups in the order `TECH_GROUPS` declares them, and the copy hint. Each group prints its `category` and its `items`. It adds no manager behaviour: it opens as one instance through the existing action with a `window` target for `skills`.
- **AC-2**: Every stack item is a button, reached in reading order with Tab and carrying the visible focus ring from the state utilities, with the item's own name as its visible label and what the press does as its accessible name (`Copy React.js`). Nothing else in the window is pressable.
- **AC-3**: A press copies that item's name and confirms it on that group's row, one name at a time: pressing another name moves the confirmation and clears the first. A polite live region announces each copy once, and it is the only announcement the window makes.
- **AC-4**: When the clipboard is absent or the write is refused, that group's row shows the shared quiet line naming the item, the item's text stays selectable, the refusal is announced once through the same live region, and nothing throws: the refusal is a value.
- **AC-5**: The printed words are in the DOM from the first paint, and the reveal is a mask over them, so a screen reader, a selection, a copy and a test read the finished stack at once. With reduced motion every line is already open and nothing moves. The reveal plays when the window opens, and a window restored from the dock keeps the stack it printed.
- **AC-6**: Each category is a heading, so the six areas are navigable by heading as well as by Tab. The mark before it is decorative and hidden from assistive tech, with the category name carrying the meaning, and it reads in `--color-success`. The output reads in `--font-roboto`, in `--color-text` on the body's surface, with `--color-text-muted` for the quieter lines.
- **AC-7**: Every colour, space, radius, duration and easing comes from the token layer, the reference `#terminal` block is gone from `src/index.css`, and every pair this window introduces is added to `src/lib/tokens.test.ts` in both modes, holding at least 4.5:1 for text and 3:1 for a mark that carries meaning.
- **AC-8**: Below the container's compact breakpoint (40rem, the value `design.md` and the Finder already use) each group stacks, with the category on its own line and its items under it, each item at least `--spacing-touch` tall, nothing scrolling sideways at 360px, and a long name wrapping instead of clipping.
- **AC-9**: A group with no items still prints its category, with the shared quiet line under it.
- **AC-10**: The body is a pure function of what the manager holds: it reads `TECH_GROUPS` and `WINDOWS` from the content layer, holds no geometry, reads no token into state, writes no storage and calls no manager action. The prompt line and the hint live in one module in the window's folder.
- **AC-11**: The body composes the shared stage, so the window has one named region, one scroll region holding the prompt line, the groups and the hint, and the shared quiet line for a missing or refused state.
- **AC-12**: The window passes the standard's registry test, and `e2e/skills.spec.ts` drives the dock open, a copy and the 360px layout in Chromium.

## Decision

**Chosen option**: one printed panel, the stack in the page from the first paint, one action per name.

The window is a body inside the shared stage: the prompt line, the group rows and the hint sit in the stage's one scroll region, and the stage's polite live region carries the single announcement a copy makes. Each name is a button whose press copies it through the shared pair, and the confirmation sits at the end of that group's row so the names never move under the pointer. The reveal masks text that is already in the DOM, so nothing about the window depends on an animation finishing.

**Implementation skills**: `gsap-core` (`greensock/gsap-skills`, `.agents/skills/gsap-core/`) · `gsap-performance` (`greensock/gsap-skills`, `.agents/skills/gsap-performance/`) · `illegal-states` (`.copilot/skills/illegal-states/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

The content layer does not change. The window reads what spec 0001 already authored.

| Entity | Primary key | Fields the window reads | Change |
|---|---|---|---|
| `TechGroup` | `TechGroupId` (six areas) | `category`, `items` | none. `TECH_GROUPS` order is the print order, and an empty `items` stays valid content |
| `WindowEntry` | `skills` | `title`, `icon` | none. The title names the stage's region |
| `WindowLayout` | `skills` | `defaultSize`, `minSize` | none (spec 0004). The body lives inside that box and scrolls |

One piece of state is new, and it is never stored:

| Entity | Shape | Where it lives | Lifetime |
|---|---|---|---|
| Copy state | `idle`, or `copied` or `failed` carrying a `CopyKey` | the window body, through `useCopyText` | until another name is copied, or the window closes |

**State transitions**:

```
open ──► printing: every line is masked, then uncovered by the timeline
             (under reduced motion the lines are already open, so nothing runs)
              │
              ▼
        idle ──press a name──► copied   (the clipboard took the write)
              ▲                  │
              │                  └──press another name──► copied (that name)
              └──press a name──► failed   (no clipboard, or the write was refused)
```

The confirmation is a function of the state, never a timer: a row shows it for as long as its name is the last one copied, and the state is gone when the window closes.

**API surface** (this window's own modules; the shared pieces are in [the standard](0006-window-body-standard.md)):

| Surface | Kind | Key inputs | Key outputs | Failure |
|---|---|---|---|---|
| `SkillsWindow` | body, `src/windows/skills/SkillsWindow.tsx` | `WindowBodyProps` | the stage holding the prompt line, the groups and the hint | prints the quiet line rather than throwing |
| `TechStack` | component | the groups, the copy state and the copy handler | one row per group | a group with no items shows the quiet line |
| `TechGroupRow` | component | one `TechGroup`, that row's `CopyOutcome`, the copy handler | the mark, the category as a heading, the item buttons, the confirmation or the failure line | none |
| `outcomeForRow(state, rowId)` | pure | the copy state and a row id | `CopyOutcome \| null` for that row | a row that is not the copied one gets `null` |
| `useLineReveal(container)` | shared hook | the container element | the lines uncovered in document order | a missing token reads as 0, so nothing animates |
| `skillsLines` | module, `src/windows/skills/skillsLines.ts` | none | `promptLine`, `copyHint` and the mark's glyph. The copy wording is not here: it is shared | none |

**Value sourcing** (every value the window produces, computes or displays names where it comes from):

| Value displayed or produced | Source |
|---|---|
| The prompt line | a literal in `skillsLines`, decided in this spec |
| The hint | a literal in `skillsLines`, the same module |
| The groups, their order and their items | `TECH_GROUPS` in the content layer, in the order it declares |
| A category's text | `TechGroup.category` |
| The heading each category prints, and the glyph beside it | the heading level is chosen in this spec, since the stage prints no heading here; the glyph is a literal in `skillsLines` |
| An item's visible label | the item string as the content holds it |
| An item's accessible name | `Copy ` plus the item string |
| The row a confirmation appears on | the `row` field of the `CopyKey` the press was made in |
| The confirmation, the failure line and the announcement | `copyLines`, shared, so every window words a copy the same way |
| The stage's region name | `WINDOWS.skills.title` |
| The reveal's duration, stagger and easing | `readMotionToken` and `readEaseToken`, so reduced motion needs no branch |
| Every colour, space, radius and duration | the token layer in `src/index.css` |

**Key invariants**:

- One instance: the window id is `skills`, so opening it while it is open focuses it rather than adding a second window (spec 0004).
- The stack is in the DOM whether or not the reveal has finished. The reveal only ever changes what is painted, and it clears the clip when it ends so no line keeps a mask over a focus ring.
- One confirmation at a time, derived from the state rather than timed.
- A copy never throws and never silently does nothing: it either confirms or shows the quiet failure line.
- The body holds no geometry and writes no storage. The frame and the manager own everything around it.

**Security model**:

Nothing here beyond the umbrella's: no accounts, no server, no input, and the clipboard is only ever written on a press. The window reads published content and shows it.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: the dock opens the window, the six groups print in `TECH_GROUPS` order, and a press copies a name and confirms it on that row, verifies **AC-1**, **AC-3**.
- The second copy: a press in another group moves the confirmation and clears the first, verifies **AC-3**.
- Failure case: a clipboard that is absent or refuses the write shows the quiet line naming the item and keeps the text selectable, verifies **AC-4**.
- Keyboard: Tab reaches every name in reading order, each is announced with what it does, and Enter copies, verifies **AC-2**.
- Empty group: a group with no items prints its category and the quiet line, verifies **AC-9**.
- Reduced motion: the stack is open at once and nothing moves, verifies **AC-5**, **AC-7**.
- Narrow width: at 360px every group stacks, nothing scrolls sideways and a long name wraps, verifies **AC-8**.

## Build plan

The project builds by Tracer Bullet, so the first milestone is one thin thread through every layer: the shared stage, the quiet line and the copy pair land and are proved on a real body. The later milestones thicken it: the copy confirmation, the reveal, the narrow layout and the token pass. No content migration is needed, because the content layer already holds the stack.

### Milestone 1: The shared pieces and the baseline test · umbrella AC-1, AC-2, AC-3

1. `WindowStage` in `src/windows/WindowStage.tsx`: the container, one named region with `tabIndex={-1}`, the optional heading, the optional sidebar slot, one polite live region and a `regionRef` that hands the region back to the body, with RTL tests for the region name, the tab order and the empty status, satisfies umbrella **AC-1**
2. Move `QuietLine` to `src/windows/QuietLine.tsx` and repoint its importers, with no change to what it renders, satisfies umbrella **AC-2**
3. `copyText` in `src/lib/clipboard.ts` returning a `Result`, plus `useCopyText`, `CopyConfirmation` and `copyLines` (the wording and `copyAnnouncement`) in `src/windows`, with unit tests for the unsupported and refused shapes, satisfies umbrella **AC-2**
4. Move the Finder onto the stage, using `regionRef` for its focus move on a place change, and move the text file body and the image file body onto it, with spec 0005's suite still green, satisfies umbrella **AC-1**
5. Move `Placeholder` onto the stage, with its line as the content, so every registered entry clears the baseline, satisfies umbrella **AC-1**
6. `src/windows/windowBodies.test.tsx`: render every entry of `WINDOW_BODIES` through the manager's provider against a bare `window` target for its own window id, and assert one stage, one non empty region name, and no colour outside the token layer in a body's own module text, satisfies umbrella **AC-3**

### Milestone 2: The thin thread · AC-1, AC-10, AC-11

1. `src/windows/skills/skillsLines.ts`: the prompt line and the hint, one literal each, satisfies **AC-10**
2. `SkillsWindow` registered in `WINDOW_BODIES` for `skills`, composing the stage and printing the prompt line, the groups in `TECH_GROUPS` order and the hint, satisfies **AC-1**, **AC-11**
3. `TechStack` and `TechGroupRow`: the decorative mark, the category and the names as a list, with RTL tests for the order and the labels, satisfies **AC-1**, **AC-6**

### Milestone 3: Copy and confirmation · AC-2, AC-3, AC-4, AC-9

1. Each name as a button with `Copy {name}` as its accessible name and the state utility focus ring, satisfies **AC-2**
2. `outcomeForRow` as a pure function over the copy state and the row id, with unit tests for the move, the clear and the failure, satisfies **AC-3**
3. `CopyConfirmation` at the end of the row, and the stage's live region carrying the one announcement, satisfies **AC-3**
4. The quiet failure line in the row, with the item's text left selectable and the refusal announced once through the same live region, satisfies **AC-4**
5. A group with no items printing the quiet line under its category, satisfies **AC-9**

### Milestone 4: The reveal · AC-5

1. `--duration-stagger` added to the token block and to the reduced motion zeroing in `src/index.css`, and `'stagger'` added to the motion token union in `src/lib/motion.ts`, satisfies **AC-5**
2. `useLineReveal`: a `gsap.context` in a layout effect that masks the lines carrying `data-line` inside the container and uncovers them in document order with the token duration, stagger and ease, cleared at the end of the timeline and on unmount so no line keeps a clip, satisfies **AC-5**
3. The proof that the text is in the DOM before the timeline runs, and that reduced motion leaves every line open and still, satisfies **AC-5**

### Milestone 5: Tokens, narrow widths and the suite · AC-6, AC-7, AC-8, AC-12

1. The token pass: the monospace face, the surfaces, the divider and the mark read from the token layer, with any new pair added to `src/lib/tokens.test.ts` in both modes, satisfies **AC-6**, **AC-7**
2. The `#terminal` block deleted from `src/index.css`, and `design.md`'s reference only paragraph updated to record it, satisfies **AC-7**
3. The stacked group layout below the compact breakpoint, with `--spacing-touch` targets, no sideways scroll at 360px and long names wrapping, satisfies **AC-8**
4. `e2e/skills.spec.ts` in Chromium: the dock open, the six groups, a copy, the second copy moving the confirmation, and the 360px layout, satisfies **AC-1**, **AC-3**, **AC-8**, **AC-12**

## Consequences

**Positive**:

- A recruiter gets the stack in one press and can take a name away without selecting it by hand.
- The stack is readable in full by assistive tech from the first paint, so the print effect costs nothing in access.
- The window is the standard's proof, so the pieces the later windows adopt are already built and tested.

**Negative / tradeoffs**:

- The confirmation lives on the row, so a visitor who has scrolled it out of view loses it.
- Every name is a tab stop, so a keyboard visitor passes seventeen stops to reach the last area. That is the cost of making each name takeable, and the areas are ordered so the first ones matter most.
- The reveal is one more moving part on open, and it needs the one new timing token.
- The narrow layout is taller than a terminal would naturally be, because every item keeps a 44px target.
- A refused copy shows in the shared quiet line rather than in an error treatment. That is deliberate: the refusal is small, the line names the item and says to copy by hand, and the announcement carries it to a screen reader, so it does not need the danger colour.

**Neutral**:

- The content layer is untouched: `TECH_GROUPS` already holds the stack.
- The frame's title bar already says `Skills`, and the stage's region reads the same name, which is the pattern the Finder set.
- The reference `#terminal` styles leave `src/index.css` with this window, so that file loses one more block of light only debt.

## Follow-up

- [ ] The stack is placeholder content from the reference build. Every name should be checked against reality before the site is shared with a recruiter.
- [ ] If the window ever needs a name that `TECH_GROUPS` does not hold, that is a content change in spec 0001's model, not a literal in the window.
- [ ] `--color-surface-paper` and the resume's ink in dark mode stay open in `design.md`; this window uses the ordinary surfaces and adds nothing there.

## Rationale

The window is the first of six content windows, so it is the cheapest place to prove the standard: it has no sidebar, one visual idea, and content that already exists in the typed layer. Printing the stack as buttons rather than as text follows from what a recruiter actually does with it, which is take one name away. Each category is a heading, so the six areas are navigable by heading, which is what keeps seventeen tab stops from being the only way through the stack. The reveal is the one place the window could have cost readability, so it masks text that is already in the page rather than typing it in, and it takes its timing from the tokens so reduced motion needs no second path.
