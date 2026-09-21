# src/windows

The window bodies: what a window shows once the shell has opened it. A body reads the target it was handed, reads the content layer, and paints inside a frame the shell has already placed. Nothing here positions, sizes or moves a window, and nothing here decides which window opens: that is `src/store` and `src/components`.

Governing specs: [`0005-projects-window`](../../docs/specs/0005-projects-window/index.md) for the Finder and the two file windows, [`0003-desktop-shell`](../../docs/specs/0003-desktop-shell/index.md) for the registry it introduced, [`0006-content-window-bodies`](../../docs/specs/0006-content-window-bodies/index.md) for the standard every body is built to, and [`0007-resume-window`](../../docs/specs/0007-resume-window/index.md) for the document window and the page it paints on.

## Files

- `WindowBody.tsx`: the one place a window id becomes a body. The props a body is given (the window id, the window key, the target), the props its own scope is given (the same three plus `children`), the entry shape (a `Body`, an optional title bar `Lead`, an optional `Scope`), and the `WINDOW_BODIES` record. Read it first.
- `Placeholder.tsx`: the stand in body that every window not built yet registers.
- `WindowStage.tsx`: the container every body is built in: the `@container` context, the optional sidebar slot, the one named content area (a `group`, `tabIndex={-1}`, the padding) and the stage's single polite live region.
- `QuietLine.tsx`: the one way a window shows an empty, missing or refused thing, promoted out of the Finder's folder so every body shares it.
- `copyLines.ts`, `copyState.ts`, `CopyConfirmation.tsx`, `useCopyText.ts`, `useLineReveal.ts`: the copy pair (its words, the state the confirmation renders from, the confirmation, the hook that writes through `#lib/clipboard`) and the staggered reveal the Skills window prints with.
- `projects/`: the Finder (`ProjectsWindow`, `FinderSidebar`, `FinderGrid`, `ProjectDetail`, `PitchContent`), the window's own state (`projectHistory`, `useProjectHistory`, `ProjectHistoryScope`, `ProjectBackButton`), the two file bodies (`TextFileBody`, `ImageFileBody`), and the Finder's own words (`quietLines`).
- `skills/`: the terminal window (`SkillsWindow`, `TechStack`, `TechGroupRow`, `outcomeForRow`, `skillsLines`).
- `resume/`: the document window (`ResumeWindow`, `useResumeFile`, `resumeLines`), the first body with an async read: its hook owns the state and the check lives at the edge.
- `projects/fileFromTarget.ts`: the file a target names, or `null` when it names none or names one that is not there. A file window's target carries the file's id rather than the file itself, so the file is looked up when the body renders and there is one truth about what it holds.

## Conventions

- A window feature edits its own line in `WINDOW_BODIES` and touches nothing else, so no window feature has to know about the desktop surface. The `Record<WindowId, WindowBodyEntry>` annotation is what makes a window id with no body a typecheck failure rather than a blank window.
- A body is a pure function of what the manager holds. It reads the target it was handed, asks `#content/reads` for what that target names, and reports a missing entry as a value (`Result` or `null`), never a throw.
- The target names what to show, so a window on a place and a window on a file are one mechanism. `Place` is a member of `openTargetSchema`, which is why the Finder looks the same whether a desktop icon, a dock button or a menu bar link sent the visitor there.
- React reserves `key`, so the instance key travels as `windowKey`. A body that changes what its own window shows calls `open(target, { kind: 'window', key: windowKey })`: the same instance with a new target. That is how the Back control works, and why a second open never makes a second window.
- Window state the manager does not own (the Finder's place history) lives in the window, in a component registered as the entry's `Scope`, wrapped around the frame so the title bar reads that state through one provider. Nothing about it is stored twice: the place showing is the instance's target.
- A window frame is already a named `region`, so a body's content area is a named `group`. Two nested regions carrying one name break every role and name query and read as a stutter in a screen reader's landmark list.
- A body renders exactly one `WindowStage`, which is what carries the container query, the content area's padding and the one polite live region. A body adds content and words only, never a second padding or a live region of its own, and the registry baseline test holds it.
- Anything outside the page (a file the site serves, the clipboard) goes through one function at the edge that returns a `Result` rather than throwing, with a hook beside the body owning the state it produces. The body itself holds no path, no request and no browser API.
- A body that paints on `--color-surface-paper` stays on the page set (`design.md`), because the paper is white in both modes while the ordinary tokens flip.
- Every literal a visitor reads lives in one pure words module for that window (`quietLines.ts`, `skillsLines.ts`, `resumeLines.ts`, `copyLines.ts`), each function named for the state it describes rather than for where it appears on screen.
- Import through the aliases (`#content`, `#lib`, `#store`, `#windows`), keep one job per module, export names only, and give every exported thing a short comment saying what it does.
- The accessibility bar holds here as it does everywhere: a control is a button with an accessible name, an image keeps its `alt` text even when its asset never loads, and a state that replaces content is text a screen reader can read.

_Drafted by /sync from the introducing change, worth a quick human pass._
