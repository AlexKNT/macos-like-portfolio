---
name: macos desktop design system
source: image
character: "A quiet desktop that behaves like an operating system: a translucent bar over a photographic wallpaper, windows with a soft grey title bar and three traffic lights, hairline edges instead of heavy shadows, and one accent blue reserved for the thing you can act on. Light and dark are the same desktop with the values swapped, never a dark theme bolted on."
tokens: "the values live in src/index.css, in one `@theme static` block and one `[data-theme='dark']` block; read them there, they are never retyped here"
contrast: "the suite in src/lib/tokens.test.ts holds 33 pairs in both modes. Body text 4.5:1, the graphics that carry meaning 3:1, and the glass pairs composited over the darkest and the lightest tone of each wallpaper. A pair that fails fails `npm test`."
---

## Build mandate

You are a senior product designer. Every window ships as a complete surface: real content from
`#content`, a title bar with the three lights, states (empty, loading, error where the window has
them), keyboard reach and a visible focus ring. Never a bare widget in a blank frame. The bar to
clear, and the disqualifier list, are in the `/develop` UI guide.

## Character and direction

The desktop is the product, and the windows are the apps in it. Two moves carry it: a photographic
wallpaper with translucent chrome floating over it, and windows that feel like paper because the
frame is one hairline and one soft shadow rather than a heavy border. Everything else stays quiet,
so the one accent blue means "you can act on this".

Direction rules that follow from that:

- Depth comes from one shadow and one hairline, not from stacking both twice.
- The wallpaper is the only busy surface. Chrome over it is translucent and always blurred; a
  surface a person reads on is opaque.
- The accent appears on actions, links, and a selected row. It is never decoration.

## Colour and the token families

Six families, each a set of semantic names. A name says what the colour is for, never what it looks
like, and the palette value appears once, in the token definition. Both modes are declared, so a
component never holds a mode.

| Family | Names | What each name is for |
|---|---|---|
| background | `--color-background`, `--color-scrim` | the ground behind the wallpaper and the fallback if it never arrives; the wash a desktop label sits on |
| surface | `--color-surface`, `--color-surface-sunken`, `--color-surface-raised`, `--color-surface-paper`, `--color-chrome`, `--color-glass-panel`, `--color-glass-hover` | a window body; a sidebar, a well or a title bar; a control above the body; a document page; and the three translucent levels |
| text | `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-text-on-accent`, `--color-desktop-text` | body text, secondary text, the quietest label, text on an accent fill, and a label that sits on the wallpaper |
| border | `--color-border`, `--color-border-strong`, `--color-divider` | a hairline that dresses a surface, the boundary of a control, and the dashed rule |
| accent | `--color-accent`, `--color-accent-quiet-bg`, `--color-accent-quiet-fg`, `--color-link`, `--color-focus-inner`, `--color-focus-outer` | the action colour, the quiet pair a selected row uses, links, and the two ring layers |
| status | `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-traffic-close`, `--color-traffic-minimise`, `--color-traffic-zoom` | the four states, and the three window lights |

The three translucent levels are named utilities rather than loose colours, so a tint and its blur
stay together: `glass-chrome` for the menu bar, `glass-panel` for the dock, `glass-hover` for a
desktop label under the pointer. Below 40rem all three give up their blur and paint
`--color-surface` instead, because blur is the expensive part on a phone.

## Type

Three families, each with a job and a fallback stack declared beside it in the token:

- `--font-georama` (`Georama`, `system-ui`, `sans-serif`): everything that is the interface.
- `--font-roboto` (`Roboto Mono`, `ui-monospace`, `monospace`): terminal output and file listings,
  where the fixed width is the content.
- `--font-display` (`Great Vibes`, `cursive`): the one script line in the desktop greeting. Decorative
  type, used once, never for a paragraph.

The scale is Tailwind's, used at these steps and no others:

| Step | Size | Used for |
|---|---|---|
| `text-xs` | 12px | a table header, a footnote, a sidebar group name |
| `text-sm` | 14px | the interface default: the menu bar, a window title, a label, a list row |
| `text-base` | 16px | body copy inside a window |
| `text-lg` | 18px | a section heading inside a window |
| `text-xl` | 20px | a window's own heading |
| `text-2xl` | 24px | a covering heading, the largest UI step |
| `text-4xl` | 36px | the desktop greeting |
| `text-5xl` and up | 48px and up | the display line only |

Weights are 400, 500 and 600. Body copy keeps a 1.5 line height, a heading tightens towards 1.2 as it
grows. Nothing is letter spaced except the display line.

## Spacing and measures

A 4px base unit, so every gap, pad and margin is a multiple of it, on an 8px rhythm for anything
larger than a hairline. Section spacing is its own larger step (`p-8`, `gap-12`), never a number
picked by eye.

The measures are tokens too: `--radius-control`, `--radius-panel`, `--radius-window`,
`--radius-dock` for corners, `--shadow-window` and `--shadow-control` for depth, `--blur-chrome` and
`--blur-panel` for the glass, `--spacing-touch` (2.75rem, 44px) as the smallest target a control may
have on a small screen, `--ease-out` and `--ease-in-out` for movement, and `--duration-fast`,
`--duration-base` and `--duration-slow` in a plain `:root` block so script can read them.

The measures script reads rather than CSS applies are pixel counts with no unit
(`--dock-magnify-scale`, and the window manager's `--window-cascade-step`, `--window-nudge-step` and
`--window-nudge-step-large`), since a custom property keeps the unit it was written with and
`readMeasureToken` would read `2rem` as 2.

Motion is read, never guessed: `readMotionToken` returns milliseconds and `readEaseToken` returns an
easing string, both from the computed value on the document element. Under reduced motion every
duration resolves to zero, so a timeline built from these tokens stops by itself.

## Window chrome

One frame, `Window`, and one set of lights, `WindowControls`. Every window composes them instead of
rebuilding a title bar.

```
┌──────────────────────────────────────────────────────────────┐
│ (o o o)   leading        window title        trailing        │  title bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                          children                            │  body
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- The shell is `--color-surface` with one `--color-border` hairline and `--shadow-window`. It sets
  neither `position` nor `z-index`: placing a window and deciding what sits on top belongs to the
  window manager.
- The title bar is `--color-surface-sunken`, separated from the body by a `--color-border` rule. It
  holds the three lights, the `leading` slot, the title, and the `trailing` slot. The title names the
  region for assistive tech, so a window is announced as "Projects" and not as an unnamed group.
- The three lights are 24px buttons holding a 14px dot, and their accessible names come from the
  title: `Close Projects`, `Minimise Projects`, `Zoom Projects`. A light with no handler renders
  `disabled`, so a window never offers a control that does nothing, and they are skipped in the tab
  order until the window manager gives them one.

## States and focus

Five interaction states, one definition each, in the stylesheet, built from tokens. A control composes
the ones it has instead of writing a class of its own.

| Utility | What it does |
|---|---|
| `interactive-hover` | a step up the surface ladder under the pointer, with the fast duration and the standard ease |
| `interactive-active` | a step down while the control is held |
| `interactive-selected` | the quiet accent pair, for the row or item that is the current choice |
| `interactive-disabled` | dimmed and not allowed, applied through the `:disabled` guard inside the utility |
| `interactive-focus` | the ring itself: compose it as `focus-visible:interactive-focus` |

The focus ring is two layers, so it reads on any surface: a 2px `--color-focus-outer` outline 2px
outside the control, and a 2px `--color-focus-inner` shadow at its edge. On a window body the inner
layer matches the body and only the outer one shows, which is the point of the pair. A default rule
gives every focused control the outer ring, so a control that has not composed the utility is still
visible, and no rule removes an outline without putting a ring in its place. Under forced colours the
ring and the window edge are redrawn from system colours, and the inner shadow is dropped rather than
left invisible.

## The rule components follow

Read semantic tokens only. A palette value appears inside a token definition and nowhere else, which
is what makes one swap of `[data-theme='dark']` move every surface at once. A component that needs a
colour the tokens do not name is a design system gap, not a reason to reach for `bg-gray-100`: note it
and bring it to `/architect`.

## Exceptions

- The three traffic light colours and `--color-info`'s light value are literal in both modes, because
  a window light pictures a window rather than expressing a state. They are therefore the one graphic
  the suite does not hold at 3:1: no amber and green clear that bar against both a light and a dark
  title bar. Each light keeps its own accessible name, so nothing depends on seeing the colour. The
  suite still asks that each light is distinguishable from the bar it sits on.
- `--color-surface-paper` is white in both modes: a document window is a page. Its ink is an open item
  below, because `--color-text` flips and a page does not.
- `--color-desktop-text` is white in both modes, and it always sits on `--color-scrim` or on the hover
  wash, never directly on the wallpaper. That is the pair the suite composites over both wallpaper
  tones.
- `--color-border` and `--color-divider` are hairlines and are not held at 3:1. A control whose
  boundary is the only thing marking it uses `--color-border-strong`, which is checked at 3:1 on both
  surfaces.
- The compact wallpaper is one image for both modes, a portrait crop. The design folder has no
  dedicated mobile wallpaper, so the crop stands in until one exists.

## Reference only, not yet migrated

`src/index.css` still carries the window classes ported from the reference build: `#safari`,
`#photos`, `#contact`, `#resume`, `#home` and `#dock`. They are palette based and light
only, and they are kept so the windows that are still to be built have a starting point. Do not copy
them as they stand. Each window feature migrates its own rules onto the tokens when it lands, and
what is left is deleted once every window is built. That is tracked debt, not a second design system.

The projects window has landed, so `#finder`, `#txtfile` and `#imgfile` are gone from that file: the
Finder builds its own surfaces from the state utilities and the token layer, and the two file
windows are ordinary bodies of the shared frame.

The skills window has landed too, so `#terminal` is gone: it prints in `--font-roboto` on the body's
own surface, with `--color-success` on the mark, `--color-text-muted` on the prompt line and the hint,
and `--color-divider` on the dashed rule above that hint.

## Open items

- The resume window is the reason `--color-surface-paper` exists. When it lands, decide what ink a
  page uses in dark mode, and add that pair to the contrast suite. Until then the paper pairs are
  checked in light mode only, and the token carries a note in the stylesheet.
- The dock's focus ring and the menu bar's icons get their pairs checked when the desktop shell
  builds them: the ring on the translucent panel is the one pair the suite cannot judge until the
  panel has a control on it.
- The appearance menu, the explicit `system` choice and the live listener that follows a system
  change join in the light and dark appearance feature. Today the mode is resolved once, before the
  first paint.
