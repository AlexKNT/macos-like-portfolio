# Verify: Sound effects · spec 0013 · created 2026-09-22

_Steps derived from spec 0013. `/check verify` runs these; `/test` locks the durable ones._

The feature is proved three ways: by the unit suites (the table and its schema, the pure rule, the storage read, the provider and the player's own factory), by driving the real desktop in Chromium with the browser's audio engine replaced by a recording stub, and by ear and by eye for the facts a headless run cannot show: what the four sounds actually sound like, what the control reads as, and what the accessibility tree reports. No fixture is needed beyond the content the desk already holds.

No step can assert the sound itself. The stub asserts that the right sound was asked for at the right moment; the ear is what confirms the tone is worth hearing. That split is stated in the spec's own Consequences rather than hidden here.

## Commands

- [ ] `npx tsc -b --force` → clean, no `any`, `SOUNDS` typed as `Record<SoundId, Sound>` with all four ids present, and the schema registered in the development check → AC-1
- [ ] `npm run lint` → clean, with `src/lib/sound.ts` exporting functions only and the provider and the hook in separate modules → AC-2, AC-10
- [ ] `npm test` → `SOUNDS` parses, holds exactly the four ids, and every entry's gain sits between 0 and 1 with its duration well under 3000ms → AC-1
- [ ] `npm test` → the development check fails for a malformed entry (a missing field, a frequency at or below zero, a duration above the ceiling) → AC-1
- [ ] `npm test` → `readMuted` answers true for `'muted'`, false for `'on'`, and false for `'true'`, `''`, `null` and a missing key → AC-2, AC-10
- [ ] `npm test` → `readMuted` and `writeMuted` answer safely when the storage itself throws, so a private window is not an error → AC-10
- [ ] `npm test` → `player.play('open', false)` with no audio engine answers `unsupported` and throws nothing, so the whole desk renders and behaves with sound absent → AC-2, AC-13
- [ ] `npm test` → `player.play('open', true)` answers `muted` and creates no node, proved through a stub engine → AC-9
- [ ] `npm test` → `createSoundPlayer()` answers a player of its own on every call, so two players never share an engine or an envelope, and `open()` on a suspended engine resumes it rather than building a second one → AC-2, AC-12
- [ ] `npm test` → `silence()` ramps every sound in flight out and is a no op when nothing is playing → AC-9
- [ ] `npm test` → `play(id, muted)` never reads storage itself: the same id answers `muted` or `played` purely from the argument it is handed → AC-2, AC-10
- [ ] `npm test` → `soundForChange` answers `open` for a window that arrived, `close` for one that left, `minimise` for one that became minimised, and nothing for a focused window, a window restored from the dock, a state handed back unchanged, and a change that only crossed the compact breakpoint → AC-4, AC-5, AC-7
- [ ] `npm test` → the rule's order of precedence holds: a change that both adds a key and removes others answers `open` alone, which is the phone's second open → AC-7
- [ ] `npm test` → the rule is pure: the same pair of states answers the same sound every time, and neither state is mutated → AC-4
- [ ] `npm test` → the rule answers `open` alone when one window replaced another under the one window rule → AC-7
- [ ] `npm test` → the provider seeds its state from `readMuted` on the first render, and a press writes the opposite through `writeMuted` exactly once → AC-8, AC-10
- [ ] `npm test` → the effect seeds its previous state without sounding, so mounting it plays nothing and React's double invoke plays nothing the second time → AC-13
- [ ] `npm test` → the four gains hold their order, so the hover row is quieter than the open row and no row sits above 1 → AC-12
- [ ] `npm test` → no module outside `src/lib/sound.ts` names `AudioContext`, `webkitAudioContext` or `new Audio(` → AC-2, AC-11
- [ ] `npm test` → no module under `src/` names an audio file extension (`.mp3`, `.wav`, `.ogg`, `.m4a`) or a URL or `fetch` for a sound → AC-11
- [ ] `npm test` → no module this feature adds carries a hex colour or a palette utility → AC-14
- [ ] `npm run build` → succeeds, and `dist/` gains no audio file (`Get-ChildItem dist -Recurse -Include *.mp3,*.wav,*.ogg,*.m4a` → no hit) → AC-11
- [ ] `npm run test:e2e` → `e2e/sound.spec.ts` passes in Chromium with `AudioContext` and `webkitAudioContext` replaced before load by a stub that pushes each played id onto `window.__soundLog`, read with `page.evaluate` → AC-3, AC-4, AC-6, AC-8, AC-9, AC-13
- [ ] `npm run test:e2e` → the stub records nothing at all before the first interaction → AC-3
- [ ] `npm run test:e2e` → after a press, a hover across the dock records `hover`, and Tab across the dock records nothing → AC-3, AC-6
- [ ] `npm run test:e2e` → a dock press records `open`, the close light records `close`, and the yellow light records `minimise` → AC-4
- [ ] `npm run test:e2e` → after muting, the same three actions record nothing new; a reload leaves the control reading as off and records nothing; unmuting records again → AC-9, AC-10
- [ ] `npm run test:e2e` → resizing across the compact breakpoint records nothing, because the instance set does not change there → AC-5
- [ ] `npm run test:e2e` → at 360 pixels, opening and closing a window records `open` then `close`, and opening a second window records `open` alone → AC-7
- [ ] read `package.json` against the last commit → no dependency added → AC-11
- [ ] read `src/index.css` and the token suite against the last commit → the control reads tokens only, and no palette value or colour literal appears in the modules this feature adds → AC-8, AC-14
- [ ] search `src/` for `document.cookie` and `sessionStorage` → no new hit from this feature, and the one storage call is the sound key → AC-10, AC-11

## UI / manual

- [ ] `npm run dev`, press the dock's Projects button → the window opens and the open sound is heard, once, after the press → AC-4
- [ ] press Close, then open again and press Minimise → the close and minimise sounds are heard, and restoring from the dock plays nothing → AC-4
- [ ] sweep the pointer across the six dock icons → the hover sound is heard as each is lit, shorter and quieter than the open sound → AC-6, AC-12
- [ ] on a fresh load, hover a dock icon before pressing anything → nothing is heard, and the same hover after a press is heard → AC-3
- [ ] Tab across the dock from the keyboard → nothing is heard → AC-6
- [ ] open a window from a menu bar link and from a desktop icon, close one with Escape, and minimise one with the keyboard → the right sound each time → AC-4
- [ ] press a dock button twice in quick succession → the window focuses rather than opening twice, and only the first press sounds → AC-4
- [ ] open two windows in quick succession → the two open sounds overlap rather than one cutting the other → AC-12
- [ ] press the sound control → the desk goes quiet at once, the icon shows the muted state, and a sound already in flight fades rather than stopping dead → AC-8, AC-9
- [ ] reload the page → the control reads as muted and the desk stays quiet → AC-10
- [ ] set the stored value by hand to `true`, then to nonsense, reloading each time → the desk plays and the control reads as on → AC-10
- [ ] press the control with the keyboard → it is reachable in order with the visible focus ring, and it reports its state (on or off) in the accessibility tree → AC-8, AC-14
- [ ] read the control's accessible name and state with sound on and with it off → one stable name (`Sound`), the state exposed as a switch's checked state, and no name change → AC-8
- [ ] at 360 pixels, open a window from a home tile and close it → the two sounds are heard, and the slim bar carries the same sound control → AC-7, AC-8
- [ ] at 360 pixels, open a second window while one is open → the first closes, only the open sound is heard, and the control is still in the bar → AC-7
- [ ] narrow the desktop across the breakpoint with two windows open → the covered windows are hidden rather than closed, and nothing is heard → AC-5
- [ ] listen to the four sounds against each other → open and close read as one family, the hover is the shortest and quietest, and none is harsh or startling → AC-12
- [ ] with the system set to reduce motion, open and close a window → the sounds are unchanged, since sound is not motion → AC-12
- [ ] open the desk in light mode and in dark mode → the sound control reads in both, following the appearance control beside it → AC-14
- [ ] set the OS to forced colours → the sound control's icon and its ring stay legible → AC-14
- [ ] watch the console from load through a dozen events → no audio warning, no autoplay refusal and no unhandled rejection → AC-2, AC-3
- [ ] delete `AudioContext` in the console before load, then use the desk → it behaves exactly as with sound and throws nothing → AC-2
- [ ] watch the network panel from load through a dozen opens → no request for a sound, and no new request at all → AC-11
- [ ] open every other window after this change → each behaves exactly as specs 0002 to 0012 verified, with the desk's other features untouched → AC-2

## Values that could be invented

- The four sounds themselves: the wave, the two pitches, the length, the gain and the noise share. They are chosen by ear inside the shape the spec fixes, and the table is the seam where they change.
- The noise burst's own length and its filter, which the player holds rather than the table.
- The ramp length for a mute during a sound, a few tens of milliseconds.
- The two icon files' drawing, in the existing set's style.
- The control's accessible name (`Sound`) and its two icons' filenames.

## Added at the build (2026-09-22)

_Recorded by `/develop` once the feature landed. The steps above are the spec's own and the build ran the whole list; these are the ones the build added or sharpened, each tied to the same acceptance criteria._

- [ ] `npx tsc -b` → `navIconIdSchema` carries `sound`, the labelled member of `navIconSchema` carries an optional `iconMuted`, and `NAV_ICONS`' sound entry sets both `/icons/sound.svg` and `/icons/sound-muted.svg`, so a sound entry that names only one image fails to compile → AC-8
- [ ] `npm test` → `player.isRunning()` answers false with no engine, false before `open()`, and true once `open()` has resumed a suspended one; that is the read the provider's listener stands down on, so it never stands down on an engine the browser did not actually wake → AC-2, AC-3
- [ ] `npm test` → the dock button's suite proves the pointer tick and the keyboard silence with the engine stood in for, so the hover path is covered without driving a browser → AC-6
- [ ] `npm run test:e2e -- e2e/phone.spec.ts` → the phone's tab walk is nine stops: the appearance control, the sound switch, then the seven tiles in reading order → AC-8
- [ ] read `public/icons/sound.svg` and `public/icons/sound-muted.svg` → a speaker, and the same speaker with one stroke through it, both drawn in the ink the icons beside them use → AC-8, AC-14
- [ ] read `vite.config.ts` → one new alias (`#sound`), and nothing else changed in it, since `jsconfig.json` and `tsconfig.app.json` already map `#*` onto `src/*` → AC-8
- [ ] `npm run test:e2e` → the stub resolves each played id from the wave and the two ends of the sweep it is handed, because production code defines no window global and carries no test hook; a row whose wave or sweep moved would stop being recognised, which is the intended signal rather than a silent pass → AC-13

### Known, and not this feature's to fix

- The bar's icons are black line drawings that do not follow the mode: in dark mode the bar's surface measures `rgba(24, 24, 27, 0.65)` and both `/icons/mode.svg` and `/icons/sound.svg` paint `0, 0, 0`. The new control copies the treatment of the control beside it (`AC-14` asks for exactly that), and row 16 owns the mode work.

