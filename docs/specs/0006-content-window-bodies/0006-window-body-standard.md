# The window body standard

_Part of spec [0006](index.md). A decision only: the rules below, and no build steps of its own. The pieces are built and proved by [the Skills window](0006-skills-window.md), Milestone 1._

## Summary

One logic for every window body in the desktop. A body is its content and its own words, staged by a shared component, reading the content layer, showing one shared quiet line when something is missing, copying through one shared pair, animating from the motion tokens, and holding one accessibility bar. The later windows adopt this, and it is held by a test over the window registry rather than by memory.

## Standard definition

**Canonical pattern**:

```tsx
/**
 * The one right way: a body is its content, and the stage is the window's shape.
 * Everything around the content (the region, the heading, the scroll, the live region)
 * comes from the stage, and every word comes from the content layer or the window's own
 * words module.
 */
export function SkillsWindow({ windowId }: WindowBodyProps) {
  const { state, copy } = useCopyText()
  const panel = useRef<HTMLDivElement>(null)

  useLineReveal(panel)

  return (
    <WindowStage name={WINDOWS[windowId].title} status={copyAnnouncement(state)}>
      <div ref={panel} className="flex flex-col gap-6 p-6">
        {/* this window's content: one line per thing it stages, nothing else */}
      </div>
    </WindowStage>
  )
}
```

**The rules**:

1. **One line in the registry.** A body registers itself in `WINDOW_BODIES` under its own window id, and its entry carries only what that window needs: a `Body`, and optionally a `Lead` for the title bar and a `Scope` for the window's own state. A window's feature replaces its own line and touches no other window.
2. **One stage.** `WindowStage` owns the container, the one named region, the heading, the sidebar slot and the polite live region, and it hands the region back through `regionRef` for the one body that moves focus on a content change (the Finder, on a place change). A body that needs a layout the stage cannot express composes the stage's pieces itself and says why in a comment.
3. **Content from one place.** A body reads the content layer (`#content`) and nothing else. Words a visitor reads that are not portfolio content live in one module in that window's folder, named for the state they describe rather than for where they happen to appear.
4. **One quiet state.** `QuietLine` is the only way a window shows an empty or missing thing. A window never writes its own placeholder styling, and never shows a hole where content should be.
5. **One copy.** Text is copied through `copyText` (the write, returning a `Result`), held by `useCopyText` (the hook, whose `copy(key, text)` takes a `CopyKey` of a `row` and a `name`), shown by `CopyConfirmation`, and worded by `copyLines`. The announcement, `copyAnnouncement(state)`, goes in the stage's live region, one per window, so both a confirmation and a refusal are announced once.
6. **Tokens only.** Every colour, space, radius, shadow, duration and easing comes from the token layer. The window's reference block in `src/index.css` is deleted in the same change that lands the window, and a pair the design system does not already hold is added to `src/lib/tokens.test.ts` in both modes: at least 4.5:1 for text, 3:1 for a mark that carries meaning.
7. **Motion from the tokens, content in the DOM.** An animation reads its timing through `readMotionToken` and `readEaseToken`, so reduced motion needs no second code path. Animated text is in the DOM from the first paint, and a reveal masks it rather than typing characters into it. A line a reveal animates carries `data-line`, which is how the hook finds its targets in document order, and the hook clears the clip on unmount as well as at the end of its timeline, so no line is ever left masked.
8. **The keyboard and naming bar.** Every control is reachable in reading order, carries the visible focus ring, and has an accessible name saying what it does. A control on a small screen is at least `--spacing-touch` (44px) tall.
9. **One width rule.** A body reads its own container widths (`@container` queries against the window's own box, never the viewport), never scrolls sideways at 360px, and wraps long text instead of clipping it.

**Replaces**:

- A body that writes its own container, region name, heading or sidebar layout.
- A body that writes its own missing state instead of `QuietLine`.
- A body that calls the clipboard itself, or invents its own copy wording and confirmation.
- A body that reaches for a raw colour, or keeps a light only block in `src/index.css`.
- A body that animates from a literal duration, or types characters into the DOM.
- A `Placeholder` entry for a window that has a body of its own.

**Enforcement**:

- **A test over the registry** (`src/windows/windowBodies.test.tsx`, running in `npm test`): every entry of `WINDOW_BODIES` is rendered through the window manager's provider and must show exactly one stage with one non empty region name, must not throw, and must not carry a colour outside the token layer in that body's own module text (a hex colour literal outside a comment, or a Tailwind palette utility such as `bg-gray-100`). A new window id therefore cannot reach the desktop without clearing the baseline.
- **The types**: `WINDOW_BODIES` is a `Record` over the window id union, so a window with no body fails the typecheck, and `WindowStage` requires a region name.
- **Review**, for what a test cannot judge (expression, wording, layout): the rules above, held in the spec and pointed at from the context files.

**Rollout**:

New code immediately, plus one migration inside this decision: the three bodies spec 0005 shipped (the Finder, the text file window and the image window) move onto the stage in the same change that adds it, with spec 0005's own suite proving their behaviour did not change. Every window still to land adopts the standard as its first task.

**Exceptions**:

None for the registry, the stage, the quiet line, the copy and the token rule. Two honest limits:

- A body whose layout the stage cannot express composes the stage's pieces itself and says why in a comment, rather than forking a second stage.
- A body with no content of its own yet (the placeholder a window shows before its feature lands) still composes the stage, with its line as the content, so the baseline stays true for every registered entry.

## Decision

One body logic, carried by four pieces in `src/windows` (`WindowStage`, `QuietLine`, the copy pair with `CopyConfirmation`, and `useLineReveal`) and held by a test over `WINDOW_BODIES`. A window body is its content and its own words, and a window's feature replaces one line in the registry. What this costs and what it buys is in [the umbrella's consequences](index.md#consequences).

## Rationale

The pieces already existed in one window. The Finder (spec 0005) had a container, a named scroll region with a heading, a quiet line and a token only surface, and the two file windows were ordinary bodies beside it. Writing the rule down now, while six windows still have to be built, costs one small migration and saves five windows each inventing their own region, their own missing state and their own copy. The shared set is deliberately four pieces: enough that a new window is content and words, small enough that a wrong guess about the gallery or the resume is cheap to correct.
