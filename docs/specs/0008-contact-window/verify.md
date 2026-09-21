# Verify: Contact window · spec 0008 · created 2026-09-21

_Steps derived from spec 0008. `/check verify` runs these; `/test` locks the durable ones._

The window is proved three ways: by the unit suites (the words module, the href builder, the row states, the tile pairs), by driving it in the real desktop in Chromium (the dock button, the bar link, the clipboard, the tab walk, 360px), and by reading what the window prints against what the content layer holds, so nothing is invented at build time. No fixture is needed: the profile and the four socials are already in the content layer, and the values the engineer fills in are ordinary content edits.

## Commands

- [ ] `npx tsc -b` → clean, with no `any`, `WINDOW_BODIES` still covers every window id, and `ContactWindow` typechecks against the body props → AC-1, AC-12
- [ ] `npm run lint` → clean → AC-12
- [ ] `npm test` → the profile schema parses with the availability field set and with it absent, since the field is optional → AC-9, AC-14
- [ ] `npm test` → the four social entries carry the four members of `socialIdSchema`, with the atom entry's id renamed `site` in place, so the list still reads `github`, `site`, `twitter`, `linkedin` and the union agrees with it → AC-14
- [ ] `npm test` → `mailLinkHref` returns the same string for the same inputs, carries the address, and percent encodes the subject and the body (a space, an ampersand and a newline in the body each come back encoded) → AC-2
- [ ] `npm test` → the body renders exactly one `WindowStage`, one named content area carrying `WINDOWS.contact.title`, the heading, the invitation line, the availability line when set, the address and four tile anchors → AC-1, AC-2, AC-7
- [ ] `npm test` → the address is one anchor whose href starts `mailto:` and carries `PROFILE.email`, and it is the same string the Copy control writes → AC-2, AC-3
- [ ] `npm test` → pressing the Copy control writes the address and nothing else (an exact string match), shows the confirmation on that row, and passes the same words to the stage's live region → AC-3, AC-4
- [ ] `npm test` → two presses on the same address return the same state object and write the same words, so the row does not flicker and nothing is announced twice → AC-5
- [ ] `npm test` → with the clipboard missing and with the write rejecting (`unsupported`, then `refused`) the row shows the shared quiet line naming the address, nothing throws, and the address is still on the page as text → AC-6
- [ ] `npm test` → the availability line shows the words verbatim when the field is set, and the body holds no such element when it is not → AC-9
- [ ] `npm test` → no module in `src/windows/contact/` writes a sentence or a control label: every visible string resolves to `contactLines` or to a content value → AC-10
- [ ] `npm test` → each tile draws its icon through a mask painted in the label's ink rather than as a plain image carrying its own white stroke, and the decorative element is hidden from assistive tech so the label alone names the link → AC-7, AC-10
- [ ] `npm test` → the registry baseline passes for every entry of `WINDOW_BODIES`, including `contact`, and no module under `src/windows/` carries a hex colour or a palette utility → AC-12
- [ ] `npm test` → `src/lib/tokens.test.ts` holds `--color-text-on-brand` against every social colour in both modes at 4.5:1, in its own list that leaves the existing token pairs untouched, and asserts the name is absent from the dark block and from `MODE_DEPENDENT` → AC-8
- [ ] `npm run build` → succeeds, works offline, and `dist/assets/*.css` carries both the ink name and the utilities the window uses → AC-8, AC-12
- [ ] `npm run test:e2e` → `e2e/contact.spec.ts` passes in Chromium, and it asserts the address anchor's `mailto:` href and its encoded subject and body rather than clicking it, so no external mail handler is invoked → AC-1, AC-2, AC-3, AC-6, AC-11
- [ ] read `src/windows/contact/` → no hex colour, no `navigator.`, no `fetch`, no storage call, no path literal and no window title typed as text → AC-10, AC-12, AC-15
- [ ] read `src/windows/WindowBody.tsx` → `contact` carries a `Body` and neither a `Lead` nor a `Scope` → AC-1, AC-15
- [ ] read `src/index.css` → the ink name appears once in the `@theme static` block, appears nowhere in the `[data-theme='dark']` block, and `#contact` is gone → AC-8, AC-13
- [ ] read `design.md` → the reference only paragraph records that `#contact` retired, and the exception for a content painted colour and its fixed ink is written beside the traffic lights → AC-13
- [ ] read `src/content/` and `src/store/` → no schema change beyond the optional availability field and the social id rename, and no manager action or layout entry changed → AC-15
- [ ] check `package.json` and `package-lock.json` → no dependency added → AC-15

## UI / manual

- [ ] `npm run dev`, then press the dock's Contact button → the window opens with the heading, the invitation line, the address row and the four tiles, replacing the placeholder body → AC-1
- [ ] press the menu bar's `Contact` link, then the dock button again → the same window, focused and on top, never a second one → AC-1
- [ ] read the window's content area in the accessibility tree → its name is `Contact`, the heading comes first, then the invitation line, then the availability line, then the address, then the tiles in content order → AC-1, AC-9
- [ ] press the address → the visitor's mail app opens a new message addressed to the profile's address, with the subject and the body from the words module, and the page itself does not navigate or open a tab → AC-2
- [ ] press the Copy control → the address lands on the clipboard exactly, and the row shows the confirmation naming the address → AC-3, AC-4
- [ ] press Copy again on the same address → the row keeps its confirmation, nothing flickers, and the live region gains no new word → AC-5
- [ ] deny the clipboard permission in the browser and press Copy → the shared quiet line names the address, the window stays whole, and the address can still be selected and copied by hand → AC-6
- [ ] with the keyboard alone, Tab from the frame → the address link, the Copy control and the four tiles are reached in reading order, each carries the visible ring, and the Copy control is announced with a name saying what it copies → AC-3, AC-7, AC-11
- [ ] read the accessibility tree for a tile → its accessible name is its label alone, and the icon is not announced → AC-7
- [ ] read the accessibility tree for the address link → its accessible name is the address, and nothing else on the page carries a second mail link → AC-2, AC-7
- [ ] open the window with the profile's availability field unset, then set → the line is absent at first with no gap left behind, and shows the words verbatim once set, then unset the field again → AC-9
- [ ] measure a tile's computed colours in both modes → the surface is the brand colour its entry carries, the label ink is the fixed ink name in both modes, and the pair clears 4.5:1 → AC-8
- [ ] set the OS to reduce motion and open the window, then hover a tile → the window itself never moves, the tile's lift takes no time at all rather than easing, and nothing waits on a duration → AC-7, AC-12
- [ ] set the OS to forced colours and open the window → the address, the Copy control and the tiles stay legible, and the ring on each control is still drawn → AC-8, AC-12
- [ ] narrow the frame below 40rem, then to 360px wide → the window holds one column, the address row wraps so the Copy control takes its own line, every tile keeps at least 44px of height, a long label wraps, and neither the frame nor the page scrolls sideways → AC-11
- [ ] zoom the page to 200% at 360px, then at 1280px → no clipping, no overlap and no sideways scroll → AC-11
- [ ] rename one icon file under `public/icons` by hand, reload, open the window → the tile keeps its label and its link and the frame stays whole, then restore the file → AC-7
- [ ] with the Contact window open, press the Projects, Skills and Resume dock buttons in turn → each still behaves as spec 0005, 0006 and 0007 verified, and the Contact window keeps its own copy state → AC-15
- [ ] listen with a screen reader where one is available → the heading, the invitation line, the address and the tile labels read in order, and a copy is announced once through the stage's one live region → AC-1, AC-4

## Values that could be invented

- [ ] the address printed, the address copied and the mail link's recipient → compare all three against `PROFILE.email`, verbatim, with no transformation → AC-2, AC-3
- [ ] the mail link's subject and body → compare against the two functions in `contactLines`, and confirm no component writes its own wording → AC-2, AC-10
- [ ] the percent encoding in the href → confirm it happens once, inside `mailLinkHref`, and that a body containing a space, an `&` and a `=` survives intact → AC-2
- [ ] the heading and the invitation line → compare against `contactLines`, and confirm the heading arrives through the stage's own heading slot rather than as a second heading written in the body → AC-1, AC-10
- [ ] the Copy control's label and its accessible name → compare against `contactLines`, and confirm the visible word sits inside the accessible name → AC-3, AC-10
- [ ] the confirmation words and the refusal words → compare against the shared `copyLines` rather than a second wording in this window → AC-4, AC-6
- [ ] the words the live region carries → compare against the shared announcement, not a line assembled in the body → AC-4
- [ ] each tile's label, icon, href and surface → compare against that `Social` entry's own fields, one by one, and confirm the order matches the content list → AC-7, AC-8
- [ ] the ink name on a tile label → compare against the token layer, confirm its value is `#1f2937`, that no other value is used for the label or the icon, and that it is absent from the dark block → AC-8
- [ ] a tile's icon → confirm it is drawn through a mask in the label's ink rather than as an image carrying its own white stroke, and that no second colour is introduced → AC-7, AC-8
- [ ] the content area's name → compare against `WINDOWS.contact.title` → AC-1
- [ ] which row confirms after a press → press Copy in this window and confirm the confirmation lands in the address row rather than anywhere else → AC-4
- [ ] the availability line's words → compare against `PROFILE.availability`, and confirm the window neither adds a prefix nor rewrites the sentence → AC-9
- [ ] every colour, space, radius and duration the window paints → read the markup and confirm each class resolves to a token in `src/index.css`, apart from the tile surface, which is the one content value this spec allows → AC-8, AC-12
- [ ] the exclusion list on the tiles → confirm no module under `src/windows/contact/` carries a palette utility or a colour literal, and that the tile surface arrives as a value rather than as a string typed in the component → AC-8, AC-12
- [ ] the absence of any other network or storage call → search the window's modules for `fetch`, `localStorage`, `sessionStorage`, `document.cookie` and `window.open` → AC-15
