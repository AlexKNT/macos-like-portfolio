# 0010. Adopt a Photos style gallery window · rationale

Reasoning, options and context for [index.md](index.md). This file is the decision record: `/develop` skips it.

## Context

The content layer has carried the gallery since spec 0001: five albums, one of them holding four photos with real `alt` text, the other four holding none. Nothing has ever read them. The `gallery` window id resolves, the dock has a Gallery button, the phone's home surface has a Gallery tile, and the body behind all three is still the placeholder spec 0003 left. A recruiter who presses that button today learns nothing.

The window is the last of the content windows, so the standard is already written down. Spec 0006 fixed the shape every body takes, the shared stage with its sidebar slot and its one live region, the one way a window shows a missing thing, the rule that all body text comes from a window's own words module, and the registry test that holds all of it. The two windows built after it, the resume and the contact window, proved that a window is a small amount of content on top of those pieces. The gallery is the first body to need more than one thing on screen at once, an album list beside a grid, and the first to hold two pieces of state, which is where the standard meets its edge.

Two forces shape the work. The first is that the gallery is a browse surface: a visitor moves between albums, then between photographs, and expects each move to be cheap and reversible. The second is that nothing here is data the site owns. The albums and the photos are authored content that never changes at runtime, so every value the window shows already exists in `ALBUMS`, and the only state worth designing is which album and which photo a visitor is looking at. That is view state, not domain state, and nothing outside the window needs to know it.

The one thing the content does not yet supply is the files themselves: the four photos point at `/images/gal1.png` to `/images/gal4.png`, and `public/images` holds no such files. The window therefore has to be honest about an image that never loads, which is a state the Finder's image window already set the tone for.

## Options considered

### Option 1: A window on the shared stage, on its own state, with the viewer inside the window

The body composes the shared stage: the album sidebar in the `side` slot, the grid in the one content region. The album showing and the photo open are ordinary React state, seeded with the first album. A press on a photo swaps the grid for a viewer panel inside the same content region, which takes focus, steps with the arrows, and hands focus back to the tile it came from when it closes.

**Pros**:

- The manager, the frame and the open target model are untouched, so the window cannot change how any other window behaves.
- The viewer lives inside the window, so the frame, the one region rule, the live region and the focus rules all keep working without exception.
- Every value the window shows already comes from `ALBUMS`, so no lookup has to be invented and the content layer stays as it is.
- It is the smallest change that still gives a gallery: one registry line, one folder, one spec file.

**Cons**:

- Nothing can open the gallery on a named album from outside the window, so a future desktop icon or menu item for one album would need a new target kind.
- The window holds two pieces of state and a focus handoff, which makes it the most involved body in the app.
- Escape means two things in one window, which needs the panel to answer the key before the frame.

### Option 2: The album as the window's target, the way the Finder's place is

The gallery window follows the Finder exactly: a new member joins the open target union so a `gallery` open can name an album, `resolveOpenTarget` names the frame from the album, and the window reads the album out of the target it was handed rather than holding it.

**Pros**:

- One mechanism for both browsing windows, so a visitor who has read the Finder already understands how the gallery keeps its place.
- An album could later be opened directly from a desktop icon, a menu bar link or a link in the page, with no second mechanism.
- The title bar would name the album it shows, which matches how a file browser behaves.

**Cons**:

- It grows the open target union, the resolver and their tests for a caller that does not exist: nothing in the content layer names an album today.
- The title bar changing on every album press makes the window harder to find in the window manager's own list, and the Finder already pays that cost for a place rather than a folder of pictures.
- The Finder's history machinery exists because Back is the point of a file browser. A gallery has no Back, so the same mechanism would arrive without its reason.

### Option 3: A read only album browser with no viewer

The window shows the sidebar and the grid and nothing else. A photo is a picture in a grid, with its `alt` text for assistive tech and no press behaviour at all.

**Pros**:

- The smallest window of the three: one piece of state, no focus handoff, no second Escape meaning.
- Nothing to get wrong with focus, and the accessibility bar is the grid's alone.

**Cons**:

- A gallery of thumbnails that cannot be looked at properly is a contact sheet, not a gallery, and a recruiter judging visual work is exactly who this window is for.
- The one gesture a visitor will try, pressing a picture, would do nothing, which reads as broken rather than as plain.

## Rationale

Option 1 wins on the two forces in Context: the window shows only authored content, and a gallery exists to look at pictures. Holding the album in the target (Option 2) buys a capability no content names today, and pays for it by growing the one model every window shares, which is the opposite of what spec 0006 asks of a later window. That an album is view state rather than a place is also the honest reading: the Finder's place decides a title and a Back destination, and an album decides neither. Option 3 answers the first force and not the second, and the window would ship as a grid of small pictures a visitor cannot look at.

The smaller calls follow the same instinct, reuse before invention, and each was settled in the design conversation:

- **A uniform grid of square thumbnails**, rather than the featured mosaic the reference block describes. The mosaic is written for exactly four photos, with the first, second, third and last child each positioned by hand, so it has no meaning for an album of six or sixteen. Chosen: a grid that flows for any count and holds its shape at any width. Runner up: the mosaic, which is closer to the reference and wrong the moment the content changes.
- **The photo press opens a viewer inside the window**, rather than an overlay over the desktop. Every other window in this app is a frame in the work area, and an overlay would be the first surface that is not, taking the menu bar with it. Chosen: a panel in the same content region, which keeps the region rule and the live region intact. Runner up: a desktop level overlay, which would need its own focus trap and its own Escape handling outside the manager.
- **The window's own state holds the album**, rather than the manager's target (Option 2 above, recorded as the runner up for the whole feature). One consequence is worth naming: the album survives a second press on the dock button or the phone tile, because the manager only re-focuses a window that is already open and never rewrites this window's target. The Finder resets to `Work` on every open because its resolver writes the place into the target, and the gallery deliberately does not copy that.
- **The arrows step and wrap**, so the viewer is a place to read the album rather than a single picture with a way out. Runner up: prev and next controls, which add two controls per photo for the same capability.
- **Escape closes the viewer first**, then the window. Escape meaning the nearest thing first is what a desktop does, and a visitor who wants the window gone presses it twice. Runner up: the viewer closing only through its own control, which would leave Escape inert on a surface that fills the window.
- **A viewer panel named by the photo, its image decorative and its caption visible but silent.** The Finder's image window instead names the image and silences the caption. Either reads the description once; in the viewer the panel is the named thing, so the panel carries the name and the picture inside it stays decorative, which is also what the live region announces. Runner up: the Finder's arrangement, an unnamed panel with the image carrying the alt text.
- **The panel owns the keys while it is open.** Escape has to reach the viewer before the frame, and the two arrows belong to the surface showing the photo, so one handler on the panel answers all three and stops Escape from bubbling any further. Runner up: the window body holding the keys, which would make it ask whether a viewer is open before every single key. No previous or next control is drawn, so stepping has no on screen surface to name and nothing new to label.
- **A failed asset is the tile's own state**, the way the image file window already holds it, rather than a set of failed photo ids in the window's state. One broken photograph then cannot change how another draws, and the window's machine stays two values wide. Runner up: a failed photo set inside `useGalleryState`, which is one fewer piece of state per tile and couples every tile to the same store.
- **Stepping is announced exactly as an open is.** The live region the stage owns fires on every change of the open photo, so a visitor who steps with the arrows hears the photograph that arrived rather than silence. Runner up: announcing on open only, which would leave the keyboard walk unread.
- **Focus moves on the album change too**, following the Finder, which moves focus to its content region when a place arrives. Runner up: leaving focus on the sidebar row, which is kinder to a pointer and means the next Tab starts from the sidebar rather than the new grid.
- **Native lazy loading**, the browser's own `loading="lazy"`, rather than a script watching the scroll. The scope row asks for lazy images and the browser already does it, so a script would be a new thing to test for no capability, and the viewer's one photo loads eagerly because the visitor asked for it by pressing.
- **The album lookup beside the window's own state**, rather than a reader in `#content/reads`. No module outside the gallery needs to name an album, and the content layer not moving is one whole class of regression this feature cannot cause. Runner up: an album reader beside `findResumeFile`, which follows a precedent but has no second caller.
- **No new content rule.** The content suite already requires the album id union to cover every album and the photo id union every photo, and an empty album is valid on purpose, which is what lets four albums stand empty. Tightening a photo's image path to a same origin path would match how the resume file path is held to `/files/`, and is worth doing the next time the content layer is opened; it is not worth doing here, since the window already handles an image that never loads.
