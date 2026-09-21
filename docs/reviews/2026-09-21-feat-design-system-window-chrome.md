# Review, feat/design-system-window-chrome, 2026-09-21

**Reviewed by**: DeepSeek V4 Pro (author on DeepSeek V4 Flash)
**Scope**: 195 files, branch vs base (`main` @ `c0f173e`, 26 commits, 20 325 insertions / 723 deletions)
**Verdict**: Changes requested

## Summary

The branch builds the whole desktop: a pure window manager with dragging, minimising, zooming and the compact fill; a dock with a token-timed magnify; and four real window bodies (Projects/Finder, Skills, Resume, Contact) on one shared stage with a shared copy pair and a registry baseline test. The code is disciplined and unusually well documented: pure reducers with derived focus, a single `Result` error shape, strict zod content, a contrast suite that holds tokens to WCAG, and tests that pin behaviour rather than mocks. Two things should block a merge: a focus-handoff race in the window exit/minimise animation lifecycle, and the contact window still shipping the reference build's placeholder identity (the known, still-unmet AC-14).

## Major

### 🟠 Closing a window during its minimise shrink fires a stale focus hop, `src/components/useWindowFrame.ts:155`
**Problem**: All frame animations share one `timeline.current` ref, which is overwritten rather than cancelled, and only `requestClose` sets `leaving.current`. The minimise shrink tween (line 155) is registered in `timeline.current`, but `requestMinimise` never sets `leaving.current`. If the visitor closes the window while it is still shrinking (Escape or the red light, within the ~320 ms `slow` duration), `requestClose` overwrites `timeline.current` with the exit timeline and the minimise tween is orphaned — it is not killed, so its `onComplete` `finish` still runs. That `finish` closure captured the `instances` array from the render it was created in, so it calls `minimise(key)` (a no-op, the key is gone) and then `applyFocusHop(focusHopAfter(staleInstances, key), elements)`, moving the keyboard a second time, to the dock button of the now-closed window or to the wrong window, computed from stale state.
**Why it matters**: The focus handoff is spec 0004 AC-8's contract ("focus never rests on something that is not there"), and the race leaves the keyboard on the dock button of a closed window after the exit timeline already placed it correctly. It is a genuine correctness bug in the one interaction the whole desktop is built around; a second `requestMinimise` during the shrink also starts a second, competing tween.
**Suggested fix**: Hold every in-flight tween (exit, shrink, restore) in a single `gsap.context` (or an array) that is killed on unmount and before starting a new one; set `leaving.current = true` in `requestMinimise`; and have `finish` re-read the latest instances or bail out once `leaving.current` is set, so a superseded tween never touches focus again.

### 🟠 The contact window ships the reference build's identity, not the engineer's, `src/content/profile.ts:14`
**Problem**: `PROFILE` still carries `name: 'Adrian'`, `role: 'Web Developer'`, `email: 'adrian@example.com'`, and `SOCIALS` (line 56) carries the JSMastery URLs (`github.com/JavaScript-Mastery-Pro`, `jsmastery.com`, `x.com/jsmasterypro`, the JSMastery LinkedIn) with `availability` deliberately unset. Spec 0008 AC-14 explicitly requires the engineer's own details before the feature is called done, and this is the known open item the verify run FAILed on.
**Why it matters**: This is a portfolio; the content *is* the product. A merged branch sends recruiters to someone else's GitHub, Twitter and LinkedIn, and a dead placeholder email address, which defeats the feature's entire purpose.
**Suggested fix**: Fill `PROFILE` (name, role, email, an availability line or a confirmed decision to omit it) and the four social URLs before merge, or gate the merge on that edit explicitly. I am not merely restating the open item: I agree with the FAIL and rate it a merge-blocking major, not a deferrable nit.

## Minor

### 🟡 `zoomWindow` writes `WORK_AREA_CORNER` literally instead of through `clampPosition`, `src/store/windowManager.ts:632`
**Problem**: The green light sets `position: WORK_AREA_CORNER` for both directions, bypassing the one writer (`clampPosition`) that every other path uses. It is safe only because `(0, 0)` happens to be the clamp's floor today.
**Why it matters**: It breaks the stated invariant that "the one place geometry is bounded" — if the clamp ever gains a non-zero floor or a right/bottom bias (e.g. for a top bar offset), zoom would be the one path that disagrees with drag and arrow keys.
**Suggested fix**: Route the corner through `clampPosition(WORK_AREA_CORNER, size, state.workArea)`, and consider restoring the window's previous spot on un-zoom rather than dropping it.

### 🟡 `checkFileIsServed` cannot detect a missing file against the dev server or preview, `src/lib/files.ts:37`
**Problem**: A `HEAD` to a public path that is not on disk answers `200 text/html` (the SPA fallback) under `vite dev` and `vite preview`, so the `missing` state is unreachable locally and a genuinely missing file would draw the HTML fallback inside the resume `<object>`.
**Why it matters**: The check's whole purpose — never offer a download for a file nobody confirmed — is defeated on the very servers the engineer uses to verify. It is only correct on a static host that 404s. This is a known open item; my disagreement is with treating it as purely a test limitation: it is also a latent production nuance if the deploy target ever serves an SPA fallback.
**Suggested fix**: A content-type assertion on the response (`application/pdf`) or an explicit spec update deciding the check may trust a same-origin 200; at minimum record the dependency on a non-fallback host in `verify.md`.

### 🟡 `openTargetFor` labels a local `/files/` path as `external`, `src/content/reads.ts:57`
**Problem**: For a `pdf` (and `link`) entry it returns `{ kind: 'external', href: entry.href }`, but a PDF's `href` is a same-origin `/files/…` path. The `outboundLinkSchema` (`https://` required) only exists at content-validation time, so this compiles and renders, but it is semantically wrong: the `external` member's contract says "leaves the app to an absolute https link".
**Why it matters**: The type system is the project's guard ("illegal states unrepresentable"), and here the union's own meaning is loosened by a constructor that never round-trips through the schema. It works today only by accident of the Finder rendering `external` as `target="_blank"`.
**Suggested fix**: Either introduce a distinct `local`/`pdf` target kind, or document in `reads.ts` why the local path rides the `external` member, so a future reader does not "fix" the schema and break the Finder.

## Nits

- ⚪ `src/windows/useCopyText.ts:50`, the clipboard promise resolves after the window unmounts with no `AbortController`/mounted guard; harmless under React 19 (no warning) but worth an early-out for consistency with `useResumeFile`.
- ⚪ `src/windows/contact/SocialTile.tsx:26`, the tile lift reuses `--dock-hover-lift`, a dock-named measure, for a window-side movement; the code even comments that it is a gap, so it deserves a follow-up ticket rather than a silent borrow.
- ⚪ `src/store/windowManager.ts:444`, `focusWindow` maps the whole array to a new `z` before checking the key exists; reordering the existence check first would skip the wasted allocation on the no-op path.

## Strengths

- The focus model is genuinely well-designed: focus is *derived* (`focusedKeyOf`) rather than stored, and the handoff chain (`focusHopAfter`) is pure and tested without a DOM, so "focus points at something that has gone" is largely impossible by construction.
- The registry baseline test (`src/windows/windowBodies.test.tsx`) is a real guard, not a formality: it renders every body, counts stages and named regions, and greps the window modules for hex literals and palette utilities, so a window cannot drift off the token layer or the one-stage standard without failing `npm test`.
- The `Result`-everywhere convention is held consistently — content lookups, the clipboard write and the file check all return a value instead of throwing, and the windows render each failure as a state rather than a broken frame.

## Test coverage

Coverage is strong: 372 unit tests in 50 files and 57 Playwright checks, with the reducer, the content schemas, the contrast pairs, the copy pair, each body's words module and the focus hop all asserted directly. The gaps map to the findings above: there is no test for a close arriving during a minimise shrink (the race in `useWindowFrame`), no test for a `zoom` while the work area is null or non-zero-clamped (the `WORK_AREA_CORNER` write), and the `missing` resume state cannot be exercised against the dev server at all (only via a routed 404 in a probe), which is exactly the three places the suite would need to catch the issues it currently cannot.
