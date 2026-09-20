# 0003. Desktop shell: rationale

_Reasoning, options and context for [index.md](index.md). `/develop` does not need this file._

## Context

Rows 1 to 5 already give the project a stack, a typed content layer, a token layer and one window frame. What none of them gives is a desktop: `App.tsx` renders the menu bar and nothing else, `WINDOWS` and `DOCK_APPS` are read by nobody, the wallpapers are painted but nothing sits on them, and the four project spots that spec 0001 carried as `windowPosition` have no surface to sit on. A visitor landing today sees a bar over a photograph.

The desktop is also the shape of the whole product. A recruiter meets the wallpaper, the greeting and the dock before they meet any content, so the shell decides whether the site reads as a desktop or as a page pretending to be one. That makes three things load bearing at once: where the work area is, how an entry point opens a window, and how the shell behaves on a phone, where a desktop metaphor does not fit.

The pressure the design has to hold is coupling. Nine window features are still to come. If the shell keeps its own list of open windows, or its own idea of where a window sits, every one of those features has to touch the desktop surface. The window frame in spec 0002 already refused that: it sets neither `position` nor `z-index`, and says stacking is the window manager's business. This feature has to honour that refusal, which means the shell needs a way to open a window before the window manager feature exists.

Then there is the phone. At 360px a dock of six icons plus a bar of links leaves nothing for content, and the scope already decided the metaphor gets reshaped rather than squeezed (row 12). This feature cannot build that switcher, but it can make sure it is not building something the switcher has to undo.

## Options considered

### Option 1: One desktop container, chrome above it, one open action, placeholder bodies

The desktop is one measured container between the menu bar and the bottom edge. The greeting, the desktop icons and the window layer live inside it, the bar and the dock paint above it, and the container's content box is the work area the window manager clamps against. Every entry point calls the same manager open action, and a window with no body yet renders a placeholder that its own feature later replaces.

**Pros**:

- One box defines the work area, so clamping needs no arithmetic on chrome heights and stays true when the chrome changes.
- No window can cover the bar or the dock, which is what makes the chrome look permanent.
- The shell is usable and verifiable in the same feature that builds it, because a dock button has somewhere to open.
- The shell holds no window state, so rows 8 to 15 never touch it.

**Cons**:

- Nine placeholder bodies are throwaway work and a real risk of growing into half windows.
- A container that must measure itself needs a resize observation and a defined fallback before it has been measured.
- Every window action the shell needs is built here, one feature before the spec that owns it.

### Option 2: Windows positioned against the viewport, chrome offsets in the clamp maths

Windows are placed against the viewport, and the clamp subtracts the menu bar height and the dock band from the numbers it uses. The desktop is not a box, only a backdrop.

**Pros**:

- Fewer elements and no measurement, so no observation code and no unmeasured state.
- Windows can pass under the dock, which some desktop designs allow on purpose.

**Cons**:

- Every chrome height becomes a number kept in step by hand, and the bar's height already changes on a small screen.
- A window can be drawn behind the dock or the bar, so the chrome stops reading as permanent.
- The same arithmetic appears in the clamp, in the cascade and in the magnify, three places to drift.

### Option 3: The desktop holds everything except the windows, which are portalled to the body

The desktop renders the greeting, the icons and the dock, and windows are portalled out of the container and positioned against the viewport in their own layer.

**Pros**:

- Windows are never clipped or stacked oddly by an ancestor, which removes a class of z-index surprises.
- The container can stay a simple backdrop.

**Cons**:

- Two coordinate spaces to reason about, one for the container and one for the viewport, and the clamp has to convert between them.
- A portal per window costs a second tree walk and makes the DOM order stop matching the visual order, which is what the keyboard order follows.

### Option 4: Placeholders replaced by a single generic window that renders content by id

No per window body: one generic window reads the window id and renders whatever the content layer holds for it.

**Pros**:

- Nothing to delete later, and one code path for every window.

**Cons**:

- It cannot be right. The nine windows need entirely different bodies (a Finder tree, a terminal, a document page), which is why the scope has a feature each.
- It would have to be dismantled window by window anyway, with the added cost of a shared component to unpick.

## Rationale

Option 1 is the only one that keeps the two promises the project already made. Spec 0002 put placement and stacking outside the frame, and rows 8 to 15 each own a window body; a shell that measures its own work area and delegates every window change keeps both promises intact, and the window manager inherits one clean input rather than a set of numbers it has to keep in step.

The placeholder bodies are the uncomfortable part, and they are chosen deliberately. Row 6's own contract says a dock button opens its window, and row 8 is three features away. A placeholder that states what will live there is honest to a visitor and cheap to delete, while an empty frame reads as broken and a rough draft of real content would duplicate work that later features own. The debt is named in Consequences and each window feature clears its own.

The greeting and the desktop icons joined the surface because design.md already reserved the pieces for them: the display font, the `text-5xl` and up display step and the desktop text token exist for one script line, and the content layer had already written down four desktop spots that nothing read. Showing them costs little and moves the first impression from a photograph with a bar to a desktop with a person on it. `windowPosition` moves out of the folder schema at the same time, so a spot is written in one place instead of two.

Two calls inside the shell are mine rather than the engineer's. The desktop icons are laid out as buttons in a labelled list in plain tab order, matching the menu bar's pattern rather than the roving tabindex a toolbar would want, because the bar already set that precedent and a toolbar adds arrow key handling for a set of six controls that fits in one Tab pass. The dock hides below the compact breakpoint rather than shrinking, because a six icon dock and a bar of links cannot both be useful at 360px, and the desktop icons still give a phone visitor a way in until row 12 lands. The runner up in both cases is the more elaborate pattern (a toolbar with arrow keys, and a shrunken dock), kept in view for the feature that later needs it.
