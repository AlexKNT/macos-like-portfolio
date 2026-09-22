# src/test

The shared helpers a suite may call, plus the file Vitest loads before each of them. Five small modules live here, and each one exists because more than one suite needed the same thing. Nothing here is imported by the app.

Governing specs: [`0004-window-manager`](../../docs/specs/0004-window-manager/index.md) for the element registry the stand in replaces, [`0009-mobile-app-switcher-shell`](../../docs/specs/0009-mobile-app-switcher-shell/index.md) for the layout helper, and [`0013-sound-effects`](../../docs/specs/0013-sound-effects/index.md) for the audio engine stand in.

## Files

- `setup.ts`: the setup file `vite.config.ts` names. It adds the jest-dom matchers and unmounts the tree after each case.
- `layout.ts`: `phoneLayout()` and `restoreLayout()`, which answer `matchMedia` the way a phone answers it, so a tree rendered afterwards is created in the phone shell rather than swapping to it.
- `registry.ts`: `stubRegistry`, a stand in for the store's element registry, holding exactly the frames, dock buttons, home tiles and desktop a case hands it.
- `audio.ts`: `stubAudio`, a stand in for the browser's own audio engine that records what it was asked for (how many engines, which wave, which sweep and which level) instead of playing anything, so a suite can observe the sound a change deserves.
- `shell.tsx`: `ShellProviders`, the two providers the shell's own modules read (the window manager, with the desk's sound nested inside it) in the order `App` mounts them, so a suite that renders a control reading either hook names the pair once.

## Conventions

- A test file sits beside the module it covers and is named after it (`src/components/Window.tsx` beside `src/components/Window.test.tsx`), which is the pattern Vitest is configured with.
- A helper here is a plain function, never a hook. A name beginning with `use` makes the lint rule read a call from `beforeEach` as a hook, and the suite stops loading, which is why the phone helper is `phoneLayout()`.
- A helper that changes the environment is called before the render it shapes and undone after it, so one case's phone does not shape the next.
- A stand in behaves like the real thing: registering `null` removes the element, so a lookup can never hand back something that has gone.

## Gotchas

- `phoneLayout()` has to run before the tree is created. The manager's provider reads the breakpoint once, before its first render, so a call made after the render leaves the desktop shell on the page and the check fails for the wrong reason.
- A control that reads the desk's sound throws outside its provider, so a suite rendering one of the shell's own controls (a bar icon, a dock button) wraps it in `ShellProviders` rather than mounting the control bare.
- Vitest runs in jsdom and takes its environment, its include pattern and its setup file from `vite.config.ts`. A suite placed under `e2e/` is not picked up by `npm test`, because the end to end suite has its own config.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
