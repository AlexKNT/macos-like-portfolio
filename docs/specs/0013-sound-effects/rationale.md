# Rationale: synthesised interface sounds with a persistent mute

Decision for spec [0013](./index.md). `/develop` does not read this file.

## Context

The desktop is the product, and the windows are the apps in it. Everything that makes it feel like a machine has been built already: the wallpaper, the translucent chrome, the draggable frames, the dock that lifts and magnifies under the pointer, the windows that fly to their dock button when they are minimised. The one sense still missing is hearing. A desktop that animates beautifully and stays mute reads as a picture of a machine rather than a machine.

The scope row (18) asks for four sounds with a mute control, for one reason it states plainly: surprise audio annoys people. That single line drives most of this design. A portfolio is visited by a recruiter who may be in an open office, on a call, or sharing a screen. Sound that arrives unbidden is not a delight, it is an interruption, and it is the fastest way to make a visitor close the tab. So the feature has two halves that matter equally: the sounds themselves, and the promise that a visitor is never surprised.

Two forces shape the first half. The site has no server and no database, and its existing rule is that no request leaves the page (the three fonts are served from the bundle for exactly that reason). The second is that the desk is built by one engineer with no audio assets to hand, and the sounds it imitates belong to a company whose recordings are not ours to ship. The obvious route, four royalty free clips, means finding them, clearing them, and carrying them in the bundle.

The second half is a browser fact rather than a choice. A browser refuses to start audio until the visitor has acted, which is the same rule the scope is asking for, expressed by the platform. Working with that rule rather than against it is the whole of the unlock design.

The desk's own conventions then decide the shape of the code. Data is immutable and lives in the content layer with a schema. A browser capability lives behind one `#lib` module that answers a value rather than throwing. Side effects live at the edges. A rule that can be pure should be pure and tested without a DOM. This feature has an unusually good fit with those conventions, which is most of why the option below wins.

## Options considered

### Option 1: Build the sounds in code with the Web Audio API, played through one edge module behind a pure rule (chosen)

Each sound is a row of numbers: a wave, a start and an end pitch, a length, a gain, and an optional share of noise. The player turns a row into a couple of nodes and schedules an envelope. The engine is opened once on the visitor's first gesture. One pure rule over the window manager's two states says which sound a change deserves, and one effect plays it. One small provider holds the muted state so both bars share it.

**Pros**:
- Nothing ships as an asset and nothing is fetched, so the bundle does not grow by a single kilobyte and no rights question is opened.
- The sounds are data, so they are reviewable, tunable and covered by the schema check, and a row can later point at a clip without touching a caller.
- The rule is pure, so every entry point is covered by construction and the coverage is proved without a browser.
- It reuses the shape the desk already has: a content table, a `#lib` edge, a store rule, a provider.

**Cons**:
- The tones approximate macOS rather than reproduce it, so the feel depends on tuning by ear and may need a second pass.
- A synthesised whoosh is harder to make convincing than a recorded one, and the noise part is doing most of that work.
- The engineer has to make four small aesthetic calls without a reference clip to measure against.

### Option 2: Short recorded clips, played through an audio element, called at each site

Four small files in `public/sounds/`, each played by a new `Audio(path)` on demand, with the call written at each place that opens, closes or minimises a window and on the dock button's hover.

**Pros**:
- The truest feel, since the clips can be chosen to match the intent exactly.
- The least code: a player of a few lines and a path per event.

**Cons**:
- Four assets to author or source, with the licence question to answer, and a request per sound unless they are inlined.
- A new element per play is the slowest path and the least predictable one, so a fast run of opens can stutter.
- A call written at each site is a rule the next entry point can forget, exactly the drift the rest of the desk avoids.
- The sound stops being data, so there is no table for a test to read.

### Option 3: Short recorded clips decoded through the Web Audio API, driven by a watcher

The same four files, decoded once into buffers and played through the engine, with a hook watching the manager's state to decide when to play.

**Pros**:
- The truest feel with the cleanest playback: low latency, overlap handled, decode once and reuse.
- The watcher covers every entry point, as option 1 does.

**Cons**:
- Still four assets to author or source, plus the faster path is also the heavier one to write.
- The watcher approach is what option 1 already does, so the only gain over option 1 is the clips, which is not the expensive half of the design.
- One more concern in the player (buffers, decode timing, the first play racing the load) than the tones need.

### Option 4: A small audio library such as howler.js

A dependency that handles unlocking, sprites, overlap and volume, with the four sounds defined as its own configuration.

**Pros**:
- The browser's quirks (unlock, iOS, overlap) are the library's problem rather than ours.
- Sprites and pooling come for free if the sound set grows.

**Cons**:
- A new dependency in a desk that has deliberately kept its runtime lean, for four sounds played a handful of ways.
- The library still needs the clips, so it does not remove the sourcing question, which is the awkward half.
- It puts a third party's concept of a sound in the middle of a codebase whose whole style is small, named, purpose built modules.

## Rationale

The choice came down to where the difficulty actually sits. The hard half of this feature is not playing a sound, it is making every entry point play the right one and never surprising the visitor. Option 1 spends its complexity there, in a pure rule that is cheap to test and cannot be forgotten, and spends almost nothing on the audio itself, because a tone costs no asset, no request and no licence. Options 2 to 4 all buy a better sound at the price of clips, and clips do not solve the harder half at all. Options 2 and 4 also scatter the decision across call sites, which is the one shape the desk has consistently refused.

The desk's existing conventions decide the rest. A table of immutable numbers is exactly what the content layer is for, and the schema check already exists to hold it. A browser capability behind one module that answers a value rather than throwing is exactly what `#lib/clipboard` and `#lib/appearance` do. The provider and hook split is what the window manager already does. The result is a feature that reads as though it was always here, which for a portfolio is not a small thing: a recruiter reading the source sees the same three ideas applied a fourth time rather than a new way of doing things.

Two placement details are worth recording, because they look arbitrary otherwise. The rule reads the window manager's state, so it cannot live in `#lib`: that folder's own rule is that nothing in it imports from `#store`. It lives in a new `#sound` folder, as a pure function over two states, beside the provider, the hook and the effect that need the same context. And because that folder's other rule is that nothing in it holds state, the player is reached through a factory rather than a module level engine: `#lib/sound.ts` exports `createSoundPlayer()`, and the provider owns the one instance for the page. Module level values there stay constants, which is the rule the folder already lived by.

The one risk accepted is the tone itself. A synthesised click will not be mistaken for a recording, and if it reads as a toy rather than a machine the feature has failed at its only job. That risk is bounded in two ways: the table is a seam, so a row can become a path to a clip with no caller changing, and the four sounds are one afternoon of tuning by ear inside a shape the spec fixes. The verdict on the tone is a listen, not a test, and the spec says so rather than pretending the suite covers it.

## Smaller decisions and their runner ups

Decisions taken during the design conversation, each with the alternative that was close.

- **How the sound reaches the events**: a pure rule over the previous and next manager state, asked in one effect. Runner up: a direct call at each site that opens, closes or minimises, which is easier to read locally but is a rule the next entry point can forget, and the desk already has enough entry points to prove that is a real risk.
- **Where the control lives**: a fifth status icon in the menu bar, which the appearance control already establishes as the place controls live, and which the phone's slim bar already knows how to carry. Runner up: a toggle inside the About window, which keeps the bar at four icons but buries the one control a visitor may want immediately.
- **The control's shape**: a switch with one stable name that reports its state, which is the correct control for something that is on or off and never announces a name that lies. Runner up: a plain button whose name swaps between Mute and Unmute, matching the appearance button's shape but announcing worse.
- **Two states or levels**: on or off. Runner up: off, quiet and full, which needs a menu or a cycling control for a nuance few visitors will use.
- **Default on a first visit**: on, gated on the first real gesture. Runner up: muted until the visitor opts in, which is the most respectful opening but hides the feature from almost everyone, and the gesture gate already removes the surprise the scope worries about.
- **Dock hover on keyboard focus**: pointer only. Runner up: also on focus, which is more consistent but turns a Tab walk across six dock buttons into a burst of noise.
- **Overlap**: each sound plays its own instance with no limit, which is what a scheduling player gives for free and what the real thing does. Runner up: a short gap between repeats, which would soften a fast sweep across the dock and remains the smallest change if that turns out to be annoying.
- **A mute during a sound**: a ramp to silence over a few tens of milliseconds. Runner up: an instant cut, which is more immediate but clicks on a live oscillator.
- **Sound under an accessibility setting**: not tied to `prefers-reduced-motion`. There is no browser setting for interface sound, sound is not motion, and the switch is the honest answer.
- **The icon assets**: two small files beside the existing set, a speaker and a speaker with a stroke. Runner up: one file with the stroke drawn in CSS, which saves a file but splits one image across two places.
- **The first gesture listener**: attached once by the provider, and standing down only once the engine reports running. Runner up: opening the engine lazily on the first sound after a gesture, which needs no listener but loses the very first hover with no rule to explain it, or a listener removed at the first call, which can leave an engine suspended asleep on a platform that opens one that way.
- **How the player is reached**: a factory the provider owns, `createSoundPlayer()`, so `#lib` keeps its no state rule and every test gets its own player. Runner up: a module level engine, which is less code but writes a mutable singleton into a folder whose own convention forbids it.
- **Where the sound code lives**: a new `#sound` folder holding the provider, the hook, the effect and the pure rule, with the player and the storage pair in `#lib/sound.ts`. Runner up: all of it in `#store` beside the manager, which reads naturally at first and then quietly widens that folder's charter from the window manager to the desktop's sounds.
- **Which sound wins when two changes land together**: a fixed order, a key that arrived as `open`, else a key that left as `close`, else a status that became minimised as `minimise`, else nothing. Runner up: reading the compact flag to work out why windows left, which turned out to describe something that never happens, since the compact layout hides covered windows rather than closing them.
- **The close and minimise sounds trailing the press**: accepted and documented, because the frame reports the state change when its movement finishes, so those two land as the window goes rather than as it is pressed. Runner up: asking for the sound at the press in the frame's own code, which reads closer to the real thing but splits the one rule this feature is built on.
