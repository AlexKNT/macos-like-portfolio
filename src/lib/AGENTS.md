# src/lib

The edges and the pure helpers behind them. Each module here wraps one thing that is neither React nor the app's own data: a browser capability (`localStorage`, the clipboard, `fetch`, the computed style of a custom property) or a piece of pure arithmetic (a colour, a contrast ratio). A component calls a function here instead of touching the browser itself, and the answer always comes back as a value.

Governing specs: [`0002-design-system-window-chrome`](../../docs/specs/0002-design-system-window-chrome/index.md) for the token layer, the motion readers and the contrast bar, [`0007-resume-window`](../../docs/specs/0007-resume-window/index.md) for the check that a file is served.

## Files

- `result.ts`: the one `Result` shape and its two constructors (`ok`, `err`). Read it first.
- `motion.ts`: `readMotionToken` and `readEaseToken`, the only way a GSAP timeline gets a duration or an easing. Both read the computed value off the document element, so a duration inherits the reduced motion answer rather than the media query being asked a second time in script.
- `measure.ts`: `readMeasureToken` and the `MeasureToken` union, for the measures a script has to compute with (the dock magnify scale, the cascade and nudge steps, the dock shrink).
- `appearance.ts`: the stored preference, the mode it resolves to, and the one place the resolved mode and the two wallpaper paths are written onto the document element.
- `files.ts`: `checkFileIsServed`, a `HEAD` request answered as `missing` or `unreachable`.
- `clipboard.ts`: `copyText`, answered as `unsupported` or `refused`.
- `tokens.ts`: the stylesheet reader behind the token suites. `readTokenLayer` and `darkOverrides` pull the theme block and the dark overrides out of `src/index.css` as colour values.
- `contrast.ts`: `parseColour`, `composite`, `relativeLuminance`, `contrastRatio` and `roundRatio`, the colour maths the token suite checks every pair with.

## Conventions

- One module per capability, and a short comment on every export saying what it does and what it returns.
- An expected failure is a value, never a throw: `Result<T, Failure>`, with a small failure union named for what went wrong. A throw is kept for a programmer error, such as a token the stylesheet does not declare.
- A module that needs the browser guards for it (`typeof document === 'undefined'`, `typeof window === 'undefined'`, a `try` around `localStorage`) and answers with the safe reading when the browser is not there, so the same code runs in jsdom, in a build step and in a private window.
- Nothing here holds state, imports React, or imports from `#components`, `#store` or `#windows`. A hook that needs state lives beside what it renders, and this folder is what that hook calls.
- Reading a CSS custom property happens here and nowhere else, so a duration, an easing or a measure is never a literal in a component.

## Gotchas

- A measure a script reads is written unitless in the stylesheet (`--window-nudge-step: 16`). A custom property keeps the unit it was written with, so `readMeasureToken` would read `2rem` as 2.
- A missing token answers 0 for a duration and 0 for a measure, and the standard ease out for an easing, rather than throwing. The caller decides what no motion means: the dock reads it as "do not magnify at all".
- `toggleAppearance` writes the mode onto the document and leaves storage alone, so a reload returns to the resolved preference. The menu that owns the stored preference is row 16, not this module.
- The script in `index.html` that resolves the mode before the first paint repeats the storage key `portfolio.appearance`, because it cannot import this module. A suite holds the two in step, so change them together.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
