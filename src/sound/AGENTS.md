# src/sound

The desk's sound: the one provider that holds the player, the pure rule that decides what a change of the window manager deserves, and the effect that joins the two. Nothing here renders a surface, nothing here decides when a window opens or closes, and nothing here names an audio API (that is `#lib/sound`): it reads the manager's own state and answers with a sound.

Governing spec: [`0013-sound-effects`](../../docs/specs/0013-sound-effects/index.md) for the four sounds, the control that silences them, the choice that survives a visit, and the silence before the visitor's first gesture.

## Files

- `SoundProvider.tsx`: the one place the player lives, and the only thing holding one. It builds the player once (through `useState`), reads the visitor's choice once, opens the engine on the first real gesture (`pointerdown`, `keydown`, `touchstart`), ramps anything in flight out when the desk is silenced, and publishes the control. It is mounted inside the window manager's provider in `App.tsx`, because the effect below reads the manager.
- `useSound.ts`: `SoundControl` (the choice, the toggle and the ask), its context, and the hook. The hook throws when there is no provider above, the way `useWindowManager` does.
- `soundForChange.ts`: the pure rule, two manager states in and a `SoundId` out. No DOM and no audio, so a suite checks it with no browser.
- `useWindowSounds.ts`: the effect that plays what the rule answers. It seeds the state it remembers on its first render and sounds nothing, which is also what makes React's development double invoke silent.
- `soundForChange.test.ts`, `SoundProvider.test.tsx`: the rule's precedence and its silences, and the player, the gesture, the switch and the stored choice. `soundModules.test.ts` is the folder's own baseline, read off the files.

## Conventions

- No entry point asks for a sound. The sound follows the manager's own state, so a dock press, a menu bar link, a desktop icon, a phone tile, one of the three lights, Escape and a phone's back press are all covered by the one reducer rather than by the control that asked.
- One press is one sound. Opening a second window on a phone closes the first under the one window rule, so the arrival is answered before the departure.
- The choice is read once, in the provider, and handed to the player on every call, so the switch and the player cannot disagree about it.
- Nothing is built before the visitor's first real gesture, and the listener that waits for one stands down only once the engine reports that it is running, since a browser may hand an engine back suspended.
- Only `#lib/sound` names Web Audio. Nothing here builds a node, schedules a tone, or touches storage.

## Gotchas

- A pointer hover is not a gesture to a browser, which is why the first hover after a press is only audible through the listener the provider installs.
- A suite that renders a control reading the sound (either bar, a dock button) wraps its tree in `ShellProviders` (`#test/shell`), or `useSound` throws. Any provider added later brings the same ripple with it.
- `stubAudio` (`#test/audio`) stands in for the engine in a unit suite. The end to end suite cannot reach app modules through the aliases, so `e2e/sound.spec.ts` installs its own stub with `page.addInitScript` instead.
- The control is a `role="switch"`, so `getByRole('button', { name })` no longer finds it: pick the role from the action kind.

_Drafted by /sync from the introducing change, worth a quick human pass._
