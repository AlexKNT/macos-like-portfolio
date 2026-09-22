# 0013. Adopt synthesised interface sounds with a persistent mute

**Date**: 2026-09-22
**Status**: Accepted

## Summary

The desktop gains four short sounds: opening a window, closing one, minimising one, and hovering a dock icon, so the machine it imitates feels like one. Each sound is made by code through the Web Audio API (the browser's own sound engine) rather than loaded from an audio file, so nothing is fetched, no clip has to be sourced, and no question of who owns a recording is opened. One speaker control in the menu bar, and the same control in a phone's slim bar, silences the desk in one press and remembers the choice between visits. Nothing plays until the visitor first touches the page, so nobody who lands on the site hears audio they did not ask for.

## Requirements

**User stories**:

- As a hiring manager browsing the desktop, I want the desk to sound like the machine it imitates, so that the metaphor lands instead of reading as a flat web page.
- As a visitor who does not want sound, I want one visible control that silences the desk and remembers my choice, so that I am never surprised by audio.
- As a keyboard or screen reader visitor, I want the sound control reachable and named with its own state spoken, so that I can silence the desk without a pointer and without guessing.
- As the engineer who ships this, I want every way into a window covered by one rule, so that a later entry point cannot forget the sound.

**Scope boundaries** (stated so a later feature does not renegotiate them):

- Row 6 (spec 0003) owns the dock, the menu bar, the desktop items and the dock magnify. Row 7 (spec 0004) owns the window manager: its state, its actions and its transitions. This feature reads the manager's two states and adds one menu bar icon. It adds no manager action, no field on the window instance and no change to the frame.
- Row 5 (spec 0002) owns the token layer, the motion readers and the `#lib` edge convention. This feature adds one `#lib` module, one new `#sound` folder (the provider, the hook, the effect and the pure rule) and one new alias in `vite.config.ts`, and it changes none of those.
- Row 16 (light and dark appearance) owns the stored appearance preference and the menu that will replace the session toggle. This feature owns one separate key and leaves `portfolio.appearance` alone.
- The four events are fixed: open, close, minimise and dock hover. A window brought to the front, a maximised window, a drag, a gallery step, an article link and an Archive emptying make no sound.
- No visitor facing volume level exists. The control is on or off. Each sound's own gain is an internal value.
- No audio file ships and no sound is fetched. Every sound is scheduled at play time from the table in the content layer.
- Sound is not tied to `prefers-reduced-motion`. The mute control is the answer for a visitor who wants quiet.
- No per window override, no sound theme, no sound packs, and no sound on the standalone text and image file windows beyond the shared open and close.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The content layer holds exactly one sound table, `SOUNDS` in `src/content/sounds.ts`, keyed by the closed union `SoundId` (`'open' | 'close' | 'minimise' | 'hover'`), with the shape declared in `src/content/types.ts` beside the other content shapes and registered in the development check, so a malformed entry fails the check. Each entry carries `id`, `wave`, `fromHz`, `toHz`, `durationMs`, `gain` and an optional `noise` share. The registry is a `Record<SoundId, Sound>`, so a missing sound fails to typecheck. `npx tsc -b` and `npm test` pass.
- **AC-2**: `src/lib/sound.ts` is the only module in the app that names a browser audio API, and it holds no module level state: it exposes a factory, `createSoundPlayer()`, which returns one small player (`open`, `play(id, muted)` and `silence()`), plus the preference pair `readMuted` and `writeMuted`. The provider holds the one player for the life of the page, so a test gets a player of its own rather than a shared one. Every call answers a value rather than throwing, the way `#lib/clipboard` and `#lib/appearance` already do: `play` answers `played`, `muted` or `unsupported`, and `readMuted` answers `false` for a value that is missing, unreadable or not one it understands. With no audio engine to hand (the unit suite's jsdom, an old browser) the whole desk renders and behaves exactly as it does with sound, and nothing throws.
- **AC-3**: Nothing is requested and no audio node is created before the visitor's first real gesture. One listener, mounted by the provider, waits for the first pointer press, key press or touch, opens the audio, and stands down only once the engine reports that it is running (a browser may open one suspended, so the listener stays until the engine is genuinely awake). A pointer hover is not counted as a gesture by a browser, so this is what makes a first hover audible after the visitor has acted. A page load with no interaction stays silent.
- **AC-4**: Opening a window plays the `open` sound, closing one plays `close`, and minimising one plays `minimise`, and every way in is covered: the dock, a menu bar link, a desktop icon, a phone tile, the three window lights, Escape, and the phone's back press. One pure rule, taking the previous and the next window manager state and answering a `SoundId` or nothing, decides which sound a change deserves. It holds no DOM and no audio, and it is unit tested with no browser. It is asked in one effect inside the manager's provider, so no entry point can omit it. Its order of precedence is fixed: a key that arrived is `open`; else a key that left is `close`; else an instance whose status became minimised is `minimise`; else nothing.
- **AC-5**: The rule stays silent for everything that is not a window arriving, a window leaving or a window being minimised. A state handed back unchanged plays nothing; a window that is focused rather than opened plays nothing; a window restored from the dock (minimised back to normal) plays nothing; a covered window that the compact layout hides rather than closes plays nothing, and crossing the compact breakpoint changes no instance at all, so it plays nothing.
- **AC-6**: A pointer entering a dock button plays the `hover` sound, and keyboard focus on the same button does not, so tabbing across the dock is silent. The dock exists above the compact breakpoint only, so hover plays on the desktop and nowhere else.
- **AC-7**: The phone surface plays `open` and `close` with the same two sounds the desktop uses. Opening a second window, which closes the first under the one window rule, plays the `open` sound only.
- **AC-8**: A sound control sits in the menu bar through `NAV_ICONS`, with `'sound'` added to `navIconIdSchema` and its action added to the label carrying union as a `{ kind: 'sound' }` member, and the same control appears in the phone's slim bar, the way the appearance control already travels. It renders as a switch (`role="switch"`) with one stable accessible name, `Sound`, and its state on `aria-checked`, which reads true while the desk is unmuted, so the name never lies and a screen reader announces the state. It is reachable by keyboard in order with the visible focus ring, and its icon shows the same state to the eye: `sound.svg` while the desk is unmuted and `sound-muted.svg` while it is muted. `MenuBarIcon` gains a branch that reads the hook, and `PhoneBar` finds the same entry.
- **AC-9**: Muting silences every sound at once. The provider calls the player's `silence()`, which ramps any sound in flight to silence over a few tens of milliseconds rather than cutting it dead (a hard cut on a live oscillator clicks), and every later `play` answers `muted` and creates no node. Unmuting restores the sounds.
- **AC-10**: The choice is stored under one key in the browser's storage and survives a reload and a later visit. A missing, unreadable or unknown stored value reads as sound on, so the desk is never stuck silent, and a storage that throws (a private window, a test) is not treated as an error. `writeMuted` is the only writer of the key, and the state reaches React from one small provider, so the control's own state can never drift from what the player reads.
- **AC-11**: No audio file is added to `public/` or to the bundle, and no code path fetches one: every sound is scheduled from the table of AC-1 by the module of AC-2. `npm run build` adds no audio asset, and no module under `src/` names a URL, a `fetch` or an `Audio` element for a sound.
- **AC-12**: Every sound is short (well under three seconds), each carries its own gain with the quiet events quieter than the loud ones, and one audio engine is created for the life of the page rather than one per sound. Two sounds arriving together each play their own instance, with no limit, no queue and no cut off. A content test holds the relative gains, so the hover row cannot be authored louder than the open row.
- **AC-13**: The unit suite covers the table and its relative gains, the pure rule, the storage read, the provider and the player's own factory with no audio engine present, so the desk's behaviour is proved without sound. It includes the restore from the dock, the state handed back unchanged, a suspended engine being resumed, and React's double invoke (the second mount of the effect plays nothing, because the effect seeds its previous state without sounding). The end to end suite replaces `AudioContext` and `webkitAudioContext` before the app loads with a recording stub that pushes each played id onto `window.__soundLog`, which the test reads with `page.evaluate`, so it can assert that opening and closing ask for the right sound, that hovering asks for its own, that a muted desk asks for none, and that the choice survives a reload. Production code carries no test hook and defines no window global of its own.
- **AC-14**: The new control meets the project's accessibility baseline: it is labelled, reachable by keyboard in order, shows the visible focus ring, and uses the same icon treatment as the appearance control beside it, so it follows the mode and holds the same contrast bar. Every value it paints comes from a token, and no colour literal or palette utility appears in the modules this feature adds.

## Decision

**Chosen option**: Option 1, build the four sounds in code with the Web Audio API, played through one edge module behind a pure rule over the window manager's state, with a persistent switch in both bars.

One table in the content layer describes the four sounds as numbers (a wave, a start and an end pitch, a length, a gain, and an optional noise share). `#lib/sound.ts` is the browser edge and holds no module level state: it exposes a factory, `createSoundPlayer()`, whose player opens the engine, plays one sound or ramps everything to silence, and it also carries the preference pair. A new `#sound` folder holds the one provider for the page (the muted state and the player's one instance), the hook the controls read, the effect beside the manager, and the pure rule that names the sound a change deserves. The dock hover is the one sound that is a pointer event rather than a state change, so `DockButton` asks the player directly, above the breakpoint only.

The rule and the provider sit outside `#lib` because `#lib` may not import from `#store`, and the rule reads the manager's own state types. The provider is nested inside the window manager's own provider, because the effect needs the manager's context and that hook throws outside it. `#store` and `#components` are both left alone: `#store` stays the window manager, the shell keeps painting what it is handed, and the desktop's sounds get their own folder and their own `#sound` alias.

**Implementation skills**: `illegal-states` (`.copilot/skills/illegal-states/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `vite` (`antfu/skills`, `.agents/skills/vite/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`)

## Feature design

**Data model sketch**:

**Sound** (`SOUNDS: Record<SoundId, Sound>` in `src/content/sounds.ts`, shape in `src/content/types.ts`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `SoundId` = `'open' \| 'close' \| 'minimise' \| 'hover'` | yes | the key; a closed union, so a typo cannot compile |
| `wave` | `'sine' \| 'triangle' \| 'square' \| 'sawtooth'` | yes | the oscillator shape |
| `fromHz` | number, above 0 | yes | the pitch it starts at |
| `toHz` | number, above 0 | yes | the pitch it sweeps to; equal to `fromHz` for a flat tick |
| `durationMs` | number, above 0 and well under 3000 | yes | the length |
| `gain` | number, 0 to 1 | yes | this sound's own level |
| `noise` | number, 0 to 1 | no | the share of a short noise burst mixed in, which is what makes a whoosh read |

**The stored choice**, one key in the browser's storage, read and written only by `src/lib/sound.ts`:

| Stored value | Meaning |
|---|---|
| `'on'` (also the answer for anything absent or unrecognised) | the desk plays its sounds |
| `'muted'` | the desk requests nothing |

No relationships. One flat table and one scalar.

**State transitions**:

- The stored choice: `on ⇄ muted`, toggled by the control, and the only two values that exist.
- The audio engine: `closed → opening → running`, begun on the visitor's first real gesture. There is no path back to `closed` (a suspended engine is resumed, never rebuilt), and `open()` called while it is suspended resumes it.
- One sound instance: `scheduled → sounding → ended`, or `scheduled → ramping → ended` when the visitor mutes while it is in flight.

**API surface** (in process, no HTTP: this app has no server and no database):

| Surface | Signature | Key inputs | Key outputs | Errors |
|---|---|---|---|---|
| the factory | `createSoundPlayer(): SoundPlayer` | none | one player holding the engine and the live envelopes | nothing thrown |
| open the audio | `player.open(): void` | none | none; a genuine no op with no engine, safe to call twice, and it resumes an engine that is suspended | nothing thrown |
| play one sound | `player.play(id: SoundId, muted: boolean): SoundOutcome` | `id` (required), `muted` (required, the caller's state) | `'played' \| 'muted' \| 'unsupported'` | answers `'unsupported'` rather than throwing |
| silence everything | `player.silence(): void` | none | ramps every sound in flight out, and is a no op with nothing playing | nothing thrown |
| read the choice | `readMuted(storage?): boolean` | none (an optional storage argument for a test) | `true` only for `'muted'`; `false` for missing, unreadable or unknown | nothing thrown |
| write the choice | `writeMuted(muted: boolean): void` | `muted` (required) | none; a no op with no storage | a throwing storage is swallowed |
| the rule | `soundForChange(prev: WindowManagerState, next: WindowManagerState): SoundId \| undefined` | the previous and next manager states | the sound the change deserves, or nothing | pure; never throws |

`src/lib/sound.ts` holds the factory, the `SoundPlayer` type and the storage pair. The new `src/sound/` folder holds `SoundProvider.tsx` and `useSound.ts` (two modules, split the way `WindowManagerProvider.tsx` and `useWindowManager.ts` are, so no file exports a component and a hook together), the effect `useWindowSounds.ts` that asks the rule and plays the answer, and the rule itself in `soundForChange.ts`. `#sound` is a new alias in `vite.config.ts`; `jsconfig.json` and `tsconfig.app.json` already map `#*` onto `src/*`, so the one entry is enough.

**Value sourcing** (every value each action produces, computes or displays, and where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| a change of the manager's state | which sound, if any, the change deserves | `soundForChange(prev, next)`, the pure rule over two states from `#store/windowManager` |
| a change of the manager's state | whether it is a real open, close or minimise rather than a focus, a restore or a hidden window | the rule's fixed order of precedence over the two states' instance keys and statuses |
| a dock button hover | the fact that a pointer entered | the pointer event on `DockButton`, rendered above the compact breakpoint only |
| playing one sound | the tone to schedule | the matching `SOUNDS[id]` row in the content layer |
| playing one sound | whether the desk is muted | the `muted` argument, passed by each caller from the provider's state, never read a second time inside the player |
| the control's own state | sound on or sound off | the provider's state, whose own source is `readMuted()` on the first render |
| the control's state after a press | the new choice, and the silence of anything in flight | `writeMuted(next)` and `player.silence()`, both through the provider |
| opening the audio | the moment it may open | the provider's one listener (`pointerdown`, `keydown` or `touchstart`), which stands down only once the engine reports running |

**Key invariants**:

- Exactly four sound ids exist and every one has an entry: the registry is a `Record<SoundId, Sound>`.
- Every sound lasts well under three seconds, so WCAG 1.4.2 (which binds audio that plays automatically for more than three seconds) never bites, and the mute switch satisfies it regardless.
- No audio file ships and no sound is requested over the network.
- Nothing plays before the visitor's first real gesture.
- One audio engine exists for the life of the page, created lazily.
- `writeMuted` is the only writer of the stored key (`portfolio.sound`, held beside `APPEARANCE_STORAGE_KEY`) and `readMuted` is the only reader.
- No module outside `src/lib/sound.ts` names a browser audio API.
- Every gain sits between 0 and 1, and the hover sound carries the smallest of the four.
- No environment variable and no credential is added: the feature has no configuration beyond that one storage key.
- The player is the only thing holding an engine or a live envelope, and it is owned by the provider: no module level value in `#lib` is anything but a constant.
- The rule's precedence is fixed and ordered, and it reads nothing but the two states it is handed.
- The open sound lands at once, because the manager appends the instance on the press. The close and the minimise sounds land with the state change, which the frame reports when its movement finishes, so those two trail the press by one movement.

**Security model**:

No authentication, no accounts, no server and no data store, so there is no authorization surface. No visitor data is collected and nothing leaves the page: the only write in the whole feature is one boolean to the browser's own storage. The compliance angle here is accessibility rather than data protection. Every sound is short, entirely visitor triggered, and switchable off from a visible, named, keyboard reachable control in both bars.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):

- Happy path: pressing a dock button asks for `open`, the close light asks for `close`, and the yellow light asks for `minimise`, verifies **AC-4**, **AC-6**, **AC-12**
- Failure case: nothing is asked for before the first gesture, and a hover that follows a press does ask, verifies **AC-3**
- Failure case: a resize across the compact breakpoint closes the covered windows and asks for nothing, verifies **AC-5**
- Edge case: a page with no audio engine renders the whole desk, answers `unsupported` and throws nothing, verifies **AC-2**, **AC-13**
- Edge case: muting while a sound is in flight ramps it out rather than cutting it, and a muted desk asks for nothing, verifies **AC-9**
- Persistence: a stored `muted` survives a reload and the control reads back as off, while a stored nonsense value reads as on, verifies **AC-10**
- Accessibility: the control is reachable by keyboard with a visible ring and reports its state to assistive tech, verifies **AC-8**, **AC-14**

## Build plan

Ordered by the project's build approach, Tracer Bullet: the first slice is a thin real thread through every layer, the table, the player, the gesture that opens the audio and the rule, with one sound heard for real when a window opens from the dock. The later slices thicken the same thread rather than starting new ones.

1. The table and its schema: `SoundId` and `soundSchema` in `src/content/types.ts`, `SOUNDS` in a new `src/content/sounds.ts`, registered in the development check, satisfies **AC-1**
2. The player edge: `src/lib/sound.ts` as a factory, `createSoundPlayer()`, returning a player with `open`, `play(id, muted)` and `silence()`, plus `readMuted` and `writeMuted`, each answering a value and never throwing, with the lazy engine, the resume and the ramp, satisfies **AC-2**, **AC-9**, **AC-11**, **AC-12**
3. The gesture that opens the audio: the provider's one listener, standing down only once the engine reports running, satisfies **AC-3**
4. The rule: `soundForChange(prev, next)` in the new `#sound` folder, pure, with its fixed order of precedence and its four silences, covered with no browser, satisfies **AC-4**, **AC-5**, **AC-7**
5. The thin thread wired: the `#sound` alias, the provider and the hook, and the effect inside the manager's provider that plays what the rule says, with the `open` sound heard on a window opened from the dock, satisfies **AC-4**, **AC-10**
6. The rest of the events: `close` and `minimise` on every entry point (the dock, a bar link, a desktop icon, a phone tile, the three lights, Escape and the phone's back press), and the phone's second open asking for `open` alone, satisfies **AC-4**, **AC-7**
7. The dock hover: `DockButton` asks for `hover` on pointer enter, above the compact breakpoint only, satisfies **AC-6**
8. The switch: `'sound'` added to `navIconIdSchema` and a `soundActionSchema` of `{ kind: 'sound' }` in the content types, the entry in `NAV_ICONS`, the `sound` branch in `MenuBarIcon` reading the hook, the same entry found in `PhoneBar`, and the two icon files, satisfies **AC-8**, **AC-14**
9. The muted path: the control writes the choice through the provider, the provider calls `writeMuted` and `silence()`, every caller passes the state into `play`, and the storage read fails safe, satisfies **AC-9**, **AC-10**
10. The suites and the records: the unit suite for the table and its relative gains, the rule (including the restore and the unchanged state), the storage, the provider, the player factory and the double invoke, plus the end to end suite with the engine stubbed through `window.__soundLog`, satisfies **AC-13**

## Consequences

**Positive**:

- No audio file ships and nothing is fetched, so the feature costs the bundle nothing and opens no question about where the clips might come from or who owns them.
- One rule over the manager's two states covers every way into a window, so a later entry point (a new link, a new control) sounds correctly without being touched.
- The desk behaves exactly as it does today for a visitor with sound off, in a browser with no audio engine, and before the first gesture.
- The mute control is one visible, named, keyboard reachable switch in both bars, and the choice survives a reload.

**Negative / tradeoffs**:

- Synthesised sounds approximate the real thing rather than reproducing it, so the feel is a matter of tuning by ear and may be revisited. A sound that does not convince is a design change, not a bug.
- The end to end suite cannot hear a sound, so it proves that the right sound was asked for rather than that it sounded. A regression in the tone itself is caught by ear, not by CI.
- A visitor who mutes still pays for the provider, the rule and the control in the bundle, a few kilobytes that exist for a feature they switched off.
- The sound fires on every open, so a visitor who keeps pressing a window open hears it every time, and there is no rate limit to soften that.

**Neutral**:

- One new storage key (`portfolio.sound`), read and written by one module.
- One new content table, one new `#lib` module, one new `#store` rule, and one small provider at the app root.
- Two new icon files beside the existing set (a speaker, and a speaker with a stroke through it).
- `src/content/AGENTS.md`, `src/lib/AGENTS.md`, `src/store/AGENTS.md` and `design.md` gain their lines for the new modules and the control in a later pass.

## Follow-up

- [ ] Give `design.md` the new control's anatomy and the nested `AGENTS.md` files their lines for the new modules, in a `/sync` pass once the build lands.
- [ ] The hover sound is the one a visitor may find chatty when the pointer sweeps across the six dock buttons. If the feedback says so, a short gap between repeats is the smallest change. Today the rule is no limit.
- [ ] Add the `illegal-states` skill (`.copilot/skills/illegal-states/`) to root `AGENTS.md`'s skills list. It shaped the closed `SoundId` union and the value rather than throw reading here.
- [ ] The close and the minimise sounds land with the movement rather than with the press, because the frame tells the manager when its animation finishes. Judge it by ear: if the trail reads as lag, the fix is to ask for the sound at the press in the frame's own code.
- [ ] If the synthesised tones do not convince by ear, one row of the table can name a recorded clip instead of a tone spec, with no change to any caller. The table is the seam for that.

## Rationale

The reasoning, the options weighed and the smaller decisions with their runner ups: see [rationale.md](./rationale.md).
