# Rationale: one body logic for every content window

_Reasoning and context for spec [0006](index.md). `/develop` skips this file._

## Context

> ⚠️ Premise note: this decision writes a standard before most of the windows that must follow it exist, which is abstraction ahead of its second use, and that is the classic way to guess wrong. The risk is real and it is contained on purpose: the shared set is four small pieces, not a framework, and nothing in the standard constrains a window's content or layout beyond the region, the quiet state and the copy. A later window the standard cannot express owes a child spec under this umbrella rather than a second pattern, which is the escape hatch that keeps a wrong guess cheap to correct.

Six content windows still have to be built (skills, resume, contact, gallery, articles, archive), and only one real body exists today: the Finder spec 0005 shipped, plus the two file windows it opened. That one body already carries almost all of the logic the others need. It reads the typed content layer, it keeps its own words in a module, it builds its surfaces from the token layer and the state utilities, it names its region and moves focus into it on a change, and it shows a quiet line rather than a broken frame when something is missing. None of that was written down as a rule, so the next five windows could each re-derive it differently, and the differences would only show up as review comments and inconsistent keyboard behaviour.

The desktop also carries a specific piece of debt that tempts the wrong move. `src/index.css` still holds the reference build's window blocks (`#safari`, `#terminal`, `#contact`, `#photos`, `#resume`, `#home` and the old `#window-controls` and `#window-header`), ported from the video build, palette based and light only. They were kept as a starting point for the windows still to be built, and the honest reading of that is: each one is a fork of the design system waiting to happen. The projects window proved the alternative by deleting three of them (`#finder`, `#txtfile`, `#imgfile`) and rebuilding on the tokens. Every window that follows has the same choice, and the standard is what makes the choice once.

Two things are missing entirely rather than inconsistent. There is no shared way to show a state where something is not there: `QuietLine` exists but lives inside the Finder's own folder, so the next window either imports across folders or writes a second one. And there is no copy pattern at all: nothing in `src/` writes to the clipboard, and nothing in `src/` has a live region, although the skills window here and the contact window (row 11) both have to say "that is now on your clipboard" without a visible change being the only signal.

## Options considered

### Option 1: One written standard, four shared pieces, proved by the Skills window (chosen)

Write the body logic down as a standard, promote the pieces it names into `src/windows` (the stage, the quiet line, the copy pair with its confirmation, the reveal hook), move the three shipped bodies onto the stage, and build the Skills window as the first body held to it. Hold the standard by a test over the window registry.

**Pros**:
- The pieces are extracted from code that already works, and proved on a real window in the same change, so the standard is not speculation about an idea nobody has run.
- A window built later is its content and its own words, which is the smallest possible change per window.
- The copy pattern arrives once and serves two windows, instead of two windows each writing their own clipboard call, their own failure wording and their own announcement.
- The registry test makes drift a failing check rather than a review argument.

**Cons**:
- It migrates three shipped bodies, so behaviour spec 0005 already verified has to be re-proved through the move.
- Some of the standard will not survive contact with the gallery (a sidebar plus a grid) or the resume (a document page), and those corrections cost a child spec.

### Option 2: Build the Skills window on its own, and let the logic emerge later

Build the skills window as its own piece of work with no shared pieces and no written rule, in the way the reference build did it, and extract the pattern once three or four windows exist.

**Pros**:
- Nothing is decided before it is needed, and no shipped body moves.
- The skills window ships in the fewest steps.

**Cons**:
- Three more windows get built before the pattern settles, so the extraction becomes a migration of five bodies rather than a move of three, and the divergence lands in the meantime.
- The copy pattern would be written twice, since the contact window (row 11) needs it soon after, and the natural drift is two different confirmations and two different failure wordings.
- The reference blocks in `src/index.css` are the path of least resistance here, and copying them forks the design system in exactly the way spec 0002 warned about.

### Option 3: A window definition registry with per window configuration

Treat the desktop as a small app platform: a window describes itself in data (size, sidebar, states, controls, content source) and one generic renderer draws it.

**Pros**:
- Adding a window becomes configuration, and the shell stays uniform by construction.

**Cons**:
- The window manager already owns geometry, status and focus (spec 0004), so a second config layer would duplicate a decided model.
- Config driven UI hides the parts of a window that are genuinely different (the Finder's history, the gallery's album filtering), and every difference becomes a config field with a condition.
- It is a much larger decision than this feature needs, and it would have to be re-decided the first time a window does not fit.

### Option 4: Adopt a component library for the window bodies

Take a general UI library and build each window from its primitives, keeping the frame from spec 0002.

**Pros**:
- Accessibility patterns (focus management, disclosure, menus) come from a maintained library.

**Cons**:
- A desktop metaphor is bespoke: the library would be fought about the frame, the title bar and the traffic lights, all of which already exist in this repo.
- The token layer is the design system, and a library brings its own, so one of the two would win and the other would rot.
- The window's real problems are not the ones a library solves: they are the region, the quiet state and the copy, which are about twenty lines here.

## Rationale

The deciding force is that the logic is not new. The Finder already proves it, so Option 1 is extraction and codification rather than invention, and the cost is one migration of three bodies inside a change that would have happened anyway. Option 2 is the tempting one and it fails on the copy: two windows need it within the same slice of work, so writing it twice is not a hypothetical cost, it is a scheduled one. Option 3 is a much larger decision that would have to be re-decided on the first window that does not fit, and Option 4 would put a second design system in the repo that spec 0002 already spent a feature replacing.

The other force is the debt in `src/index.css`. The reference blocks are light only and palette based, so a window that copies one is a window that fails dark mode and the contrast suite, which the project treats as a failing test rather than a review note. Making the standard explicit, and making the deletion of that window's block part of the change that lands the window, turns a temptation into a checklist item.

### Decisions taken while writing this spec

- **The stage's name and range**: `WindowStage`, owning the container, the region, the heading and the sidebar slot. The runner up was `WindowShell`, which clashes with the desktop shell of spec 0003, and `WindowPane`, which usually means a sidebar in this vocabulary. The stage is named for the panel the content plays on, and it keeps the sidebar optional so the Finder and the gallery compose it rather than fork it.
- **The region kind**: a named group (`role="group"`) with `tabIndex={-1}`, not a second landmark. The frame is already a named region (the `section` inside `Window`), so a second landmark with the same name reads as a stutter in a screen reader's landmark list. This follows what spec 0005 already proved in the Finder.
- **Where the announcement lives**: one polite live region per window, owned by the stage. The runner up was a live region per row, which would put six or more in one window and announce from whichever changed last.
- **The copy state's shape**: `idle`, or `copied` or `failed` carrying a `CopyKey` of a row and a name. A pair of booleans or two optional strings would allow "copied and failed" and "copied with no name", which the union makes unwritable.
- **Where the confirmation shows**: at the end of that group's row, not beside the pressed name. Beside the name is more precise, but it reflows the names themselves on every press, which moves the target a visitor is about to press next.
- **A refused copy shows in the shared quiet line**, not in an error treatment. The runner up was the danger colour, which would have meant a second quiet state and a second pair to check for a small, recoverable refusal that the live region already announces.
- **Each category is a heading**, so the six areas are navigable by heading and not only by seventeen tab stops. The runner up was plain text with the region carrying the only name, which reads fine but leaves a screen reader user walking the names one by one.
- **The stage hands its region back through `regionRef`**, so the Finder keeps the focus move spec 0005 gave it (focus the content region on a place change) while the region markup itself lives in one place. The runner up was letting the Finder keep its own region markup, which would have meant two places writing the same thing.
- **The reveal's mechanism**: a mask animated with `clip-path` over text that is already in the DOM, cleared with `clearProps` when the timeline ends. The performance skill prefers transforms, and a transform is available here only as a cover element that would add one element per line, need the body's surface colour painted over the text, and hold an `overflow: hidden` wrapper that clips a focus ring. Eight lines for under half a second of paint only work is the cheaper honesty. The runner up was the scaleX cover.
- **The stagger's source**: one new token, `--duration-stagger`, zeroed under reduced motion with the other durations. The runner up was deriving the stagger from an existing token (a fraction of `--duration-base`), which hides a second timing value inside a component and defeats the project's rule that timing is read, never guessed.
- **Where the reveal hook lives**: in `src/windows` with the other shared pieces, so a later window that wants the same print effect reuses it rather than writing a second one. It is the one shared piece with a single user today, and it is small.
- **The terminal's words**: the prompt line and the hint are chrome in `skillsLines`, not content entries, because neither is a fact about the portfolio: one frames the panel, the other says what a press does. Nothing in the content model changes.

## Evidence: the audit of what is already there

Read on 2026-09-20, so the standard is drawn from the real code rather than from an idea of it.

| Body | Container | Named region | Heading | Own scroll region | Quiet state | Reads content layer | Gaps against the standard |
|---|---|---|---|---|---|---|---|
| `ProjectsWindow` | yes, `@container` | yes, `role="group"` named by the place, `tabIndex={-1}` | yes, an `h2` with the place's name | yes, on the content region | yes, `QuietLine` | yes | The region, the heading and the sidebar layout are hand written in the body, so the next window would write them again |
| `TextFileBody` | no | no | no | no | yes, `QuietLine` | yes | No stage: a padded `div` and an `article`, with nothing naming the region |
| `ImageFileBody` | no | no | no | no | yes, `QuietLine` | yes | No stage: a `figure` filling the height, with nothing naming the region |
| `Placeholder` | no | no | no | no | its own line | no, reads `WINDOWS` | Centred icon, title and line; the entry every unbuilt window still registers |

Also confirmed by search, and these are what the standard adds rather than unifies:

- `navigator.clipboard` appears nowhere in `src/`, so the skills window (and the contact window after it) would be the first, twice.
- `aria-live` appears nowhere in `src/`, so nothing in the app currently announces a change that has no visible focus move.
- `QuietLine` sits in `src/windows/projects/`, and its only importers are that folder's bodies, so a second window either reaches into that folder or writes its own.
- The frame (`Window`) already gives every window a named region, a focusable frame and an `overflow-auto` body area, which is why the stage's own scroll region is the one a visitor uses and the frame's is only a fallback.

The reference blocks still in `src/index.css`, with the windows that own retiring them:

| Block | Line | Owning row |
|---|---|---|
| `#safari` | 421 | 14, Articles window |
| `#terminal` | 465 | 9, Skills window (this decision) |
| `#contact` | 511 | 11, Contact window |
| `#photos` | 539 | 13, Gallery window |
| `#resume` | 599 | 10, Resume window |
| `#home`, `#dock`, `#window-controls`, `#window-header` | 609, 381, 401, 417 | shell work, and the chrome spec 0002 replaced |
