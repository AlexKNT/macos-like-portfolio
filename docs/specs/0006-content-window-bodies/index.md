# 0006. Adopt one body logic for every content window

**Date**: 2026-09-20
**Status**: Accepted

## Summary

Every window in this desktop should be built the same way: one shared stage (the panel a window's content sits in), one rule for reading content, one way to show a state where something is missing, and one accessibility bar. This decision writes that logic down as a standard, then builds the Skills window as its first proof, so the windows still to come (resume, contact, gallery, articles, archive) compose the same pieces instead of each inventing its own. The window manager does not change, and the content layer stays exactly as it is.

## Structure

- [0006-window-body-standard.md](0006-window-body-standard.md): the standard. The rules every window body follows, what it replaces, how it is held, and the one canonical example. A decision only, with no build steps of its own.
- [0006-skills-window.md](0006-skills-window.md): the Skills window (scope row 9), the first body built to the standard. This is where the shared pieces and the test that holds them land.

**Cross child contract**:

- The standard names the pieces and the rules; the Skills window builds the pieces and proves them on a real window. Neither child restates the other, so each is read on its own.
- A later window (rows 10, 11, 13, 14, 15) adopts the standard by replacing its own line in `WINDOW_BODIES`, composing what already exists, and deleting its own reference block from `src/index.css` in the same change. It never re-decides the shared logic.
- If the standard genuinely cannot express what a later window needs, that is a new child spec under this umbrella. A second pattern inside `src/windows` is not the answer.
- The shared pieces belong to `src/windows` and stay few: the stage, the quiet line, the copy pair with its confirmation, and the reveal hook.

## Requirements

**User stories**:

- As a recruiter, I want every window to behave the same way, so that learning one window teaches me the next.
- As a keyboard or screen reader user, I want the same bar in every window, so that a named region, one scroll region, a visible focus ring and a line saying what happened are never a fresh surprise per window.
- As the engineer building the windows still to come, I want one stage and one set of rules, so that a new window is its content and its own words and nothing else.
- As the person reviewing a change, I want the standard held by a test rather than by memory, so that drift is caught instead of argued about.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the desktop container, the menu bar, the desktop icons and the dock. Row 7 (spec 0004) owns geometry, focus, dragging, minimising, zooming and closing. This decision adds no manager action and no frame behaviour.
- This decision owns the window body: what sits inside the frame.
- The Skills window's own content decisions live in its child spec.
- The standard covers window bodies only. The dock, the menu bar and the desktop icons keep their own rules.
- No new library. GSAP (already installed) covers the one animation, and the token layer covers the values.
- Rows 10 to 15 are not designed here. They adopt the standard when they land.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: One shared stage component is the only place a body's container, its named region, its heading and its sidebar layout are written. Every entry of `WINDOW_BODIES` composes it, including the three bodies spec 0005 shipped, and spec 0005's own acceptance criteria still hold after the move.
- **AC-2**: One shared quiet line is the only way a window shows a missing or empty state, and one shared copy pair (the `copyText` function and the `useCopyText` hook) with one shared confirmation piece is the only way a window copies text and says what happened.
- **AC-3**: A test walks every entry of `WINDOW_BODIES`, renders each one through the window manager's provider against a bare `window` target for its own window id, and fails when a body renders no stage or no region name, or when a body's own module text carries a colour that is not a token (a hex colour literal outside a comment, or a Tailwind palette utility such as `bg-gray-100`). It runs inside `npm test`.
- **AC-4**: The Skills window (scope row 9) is built to the standard, so the logic is proved by a real window rather than only written down.

## Decision

**Chosen option**: Option 1, one shared stage plus a written standard, proved by the Skills window.

One body logic, written down as a standard and carried by four shared pieces in `src/windows`: `WindowStage` (the container, the one named region, the heading, the sidebar slot and the single polite live region), `QuietLine` (the missing state, promoted out of the Finder's own folder), the copy pair (`copyText` in `#lib/clipboard.ts` plus `useCopyText` and `CopyConfirmation` in `src/windows`), and `useLineReveal` (the one implementation of a print effect). Every window body is then its content and its own words, registered by one line in `WINDOW_BODIES`. The standard is held by a test over that registry, so a new window id cannot reach the desktop without clearing the baseline.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `illegal-states` (`.copilot/skills/illegal-states/`) · `gsap-core` (`greensock/gsap-skills`, `.agents/skills/gsap-core/`) · `gsap-performance` (`greensock/gsap-skills`, `.agents/skills/gsap-performance/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Shared surface** (the concrete form of the cross child contract; the rules are in [the standard](0006-window-body-standard.md)):

| Surface | Kind | Key inputs | Key outputs | Failure |
|---|---|---|---|---|
| `WindowStage` | shared component, `src/windows/WindowStage.tsx` | `name`, `heading?`, `side?`, `status?`, `regionRef?`, `children` | the container, the one named focusable scroll region, the heading, the sidebar slot, the polite live region | a stage with no `name` fails the typecheck |
| `QuietLine` | shared component, moved to `src/windows/QuietLine.tsx` | the words to show | the line a missing or empty state shows | none |
| `copyText` | function at the edge, `src/lib/clipboard.ts` | the text | `Result<string, ClipboardFailure>` | `kind: 'unsupported'` when the browser offers no clipboard, `kind: 'refused'` when the write is rejected |
| `useCopyText` | shared hook, `src/windows/useCopyText.ts` | nothing for the hook itself; `copy(key: CopyKey, text: string)`, where `CopyKey` is `{ row, name }` | `{ state, copy }`, where the state is `idle`, `copied` or `failed` and carries the key | a refused or absent clipboard becomes the `failed` state, never a throw |
| `CopyConfirmation` | shared component, `src/windows/CopyConfirmation.tsx` | `outcome: CopyOutcome \| null` | the row's confirmation, or the quiet failure line, or nothing | none |
| `copyLines` | shared words, `src/windows/copyLines.ts` | a name, or a copy state | the confirmation, the failure line and `copyAnnouncement(state)`, each written once for the whole app | none |
| `useLineReveal` | shared hook, `src/windows/useLineReveal.ts` | the container element | a masked reveal of the lines marked inside it | a missing token reads as 0, so nothing animates |

**Value sourcing** (every value this decision produces, computes or displays names where it comes from):

| Value displayed or produced | Source |
|---|---|
| A stage's region name | the body's own subject: the window's title from `WINDOWS[id].title`, or the thing it shows (the Finder reads the place) |
| A stage's heading | the body, when the thing staged has a name of its own |
| The line a missing state shows | `QuietLine`, carrying the words from that window's own words module |
| The row a confirmation appears on | the `row` field of the `CopyKey` the window chose, compared by `outcomeForRow` |
| The announcement a copy makes | `copyLines`, the same module for every window |
| Every colour, space, radius, duration and easing | the token layer in `src/index.css`, read as utilities or through `readMotionToken` |

**Key invariants**:

- One window id, one body: `WINDOW_BODIES` is a `Record` over the window id union, so a window with no body fails the typecheck.
- A body renders exactly one stage, and the stage holds exactly one named region with `tabIndex={-1}` (focusable by script, never in the tab order).
- A body that moves focus on a content change (the Finder, on a place change) does it through the stage's `regionRef`, so the stage stays the only place its region markup is written.
- A body reads content from `#content` only. It holds no geometry, reads no token into state, writes no storage, and calls only the manager actions it needs.
- A copy is never thrown: a refused or absent clipboard is a value, and the text stays selectable.
- One polite live region per window, in the stage, so a silent change is announced once and no window invents its own.
- Every duration and easing a window animates with is read from a token, so reduced motion needs no second code path.

**Security model**:

There are no accounts, no sessions, no server and no personal data beyond the portfolio's own public content, and nothing a visitor types. The one browser capability this decision touches is the clipboard, and it is only ever written on a press: nothing is read from it, and a refusal is shown rather than retried in a loop. The stage adds no navigation, no fetch and no storage.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Baseline over the registry: every entry renders inside the provider, each with one stage and one non empty region name, verifies **AC-1**, **AC-3**.
- A body with nothing to show: the text file window's unreadable target and an empty group each render the shared quiet line, verifies **AC-2**.
- A refused copy: `copyText` returns the failure value and the row shows the quiet line rather than throwing, verifies **AC-2**.
- The Skills window end to end: the dock opens it, a name is copied and confirmed, and the layout holds at 360px, verifies **AC-4**.
- Reduced motion: the reveal reaches its end state with no movement and no half masked line, verifies **AC-4**.

## Build plan

The project builds by Tracer Bullet, so the shared pieces land first as one thin thread and are proved on a real body before they are thickened. The work itself belongs to the two children: this spec has no build steps of its own, which is why every task below names its child.

1. The shared pieces and the test over the registry: [0006-skills-window.md](0006-skills-window.md), Milestone 1, satisfies **AC-1**, **AC-2**, **AC-3**
2. The Skills window itself: [0006-skills-window.md](0006-skills-window.md), Milestones 2 to 5, satisfies **AC-4**
3. Every later window: its own feature spec, which adopts the standard as its first build task rather than a task of this one.

## Consequences

**Positive**:

- A window built from here on is its content and its own words. The stage, the region name, the scroll region, the quiet line, the copy and the reveal are already decided, so a new window is a smaller change.
- The three bodies spec 0005 shipped land on the same stage, so the Finder, the text file window and the image window stop each writing their own region markup.
- The copy pattern arrives once and serves the contact window later, instead of two windows each writing their own clipboard call and their own failure wording.
- Drift is caught by a test over the registry rather than by review.

**Negative / tradeoffs**:

- The standard is written before five of the six windows exist, so parts of it may not survive contact with the gallery (a sidebar plus a grid) or the resume (a document page). The shared set is kept to four pieces so a wrong guess stays cheap to correct.
- The stage's sidebar slot is machinery for two windows today: the Finder, and later the gallery.
- The reveal adds one duration token to the design system for one window.
- The confirmation stays on the row, so a visitor who scrolls it out of view cannot see it.
- Moving three shipped bodies onto the stage risks behaviour spec 0005 already verified, so its suite has to stay green through the move.

**Neutral**:

- The content layer is untouched: no field, no entry and no rule changes.
- The frame's own scrolling (the `overflow-auto` inside `Window`) stays as a container fallback; the stage is the scroll region a visitor actually uses.
- The reference `#terminal` block retires from `src/index.css`, while `#safari`, `#photos`, `#contact`, `#resume`, `#home` and `#dock` stay until their own windows land.

## Follow-up

- [ ] `src/windows/AGENTS.md` does not exist. The body rules belong there (loaded only when working in that folder), with one pointer line in root `AGENTS.md`; `/sync` owns that file. Until then the standard is read from this spec.
- [ ] Spec 0005's build plan and verify rows name `src/windows/projects/QuietLine.tsx`. `QuietLine` moves to `src/windows/` in this decision, so those pointers need correcting the next time spec 0005 is touched.
- [ ] `--duration-stagger` is the design system's first timing value for a staggered print. If a second window wants a different rhythm, that is a new decision rather than a second literal.
- [ ] Rows 10, 11, 13, 14, 15 each adopt the standard as their first task. The gallery shares the Finder's sidebar shape, so the sidebar slot may need a second look when that row lands.

## Rationale

Reasoning, options and context: see [rationale.md](rationale.md).
