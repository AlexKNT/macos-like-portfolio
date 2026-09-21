# 0008. Reach you from a copyable address, a mail link and the socials

**Date**: 2026-09-21
**Status**: Accepted

## Summary

The Contact window is how a recruiter reaches you: your address shown as text and taken in one press, the same address as a mail link that hands their mail app a short note already written, and the four social profiles as their own tiles. It reuses what the desktop already carries (the shared window stage, the copy pair the terminal window introduced, the profile and the socials in the content layer) and adds one small thing to the content model, an optional availability line. Each tile keeps the brand colour its entry carries, painted against one new ink name that never flips, so the labels clear the contrast bar in both modes. There is no new dependency, no server, no form and no portrait.

## Requirements

**User stories**:

- As a recruiter, I want your address in one press with the rest of your profiles beside it, so that reaching you takes seconds.
- As a visitor whose clipboard is blocked by the browser, I want the address still readable and selectable, so that the window is never a dead end.
- As a keyboard or screen reader user, I want every link and control named and reachable in reading order, so that nothing here depends on a pointer or on seeing a colour.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The Contact window replaces the placeholder body and opens from the dock's Contact button and the menu bar's Contact link, as one instance that is focused and never doubled. Its body is one stage whose named content area carries `WINDOWS.contact.title`, and inside it, in reading order: the heading, passed through the stage's own heading slot so the window holds exactly one heading, with the invitation line under it, the availability line when the profile carries one, the address row, then the social tiles. There is no portrait.
- **AC-2**: The address is printed as text, and that text is the mail link: one anchor whose `href` is a `mailto:` carrying `PROFILE.email` plus the subject and the body from the window's words module, with every carried value percent encoded, so a press hands the visitor's mail app a new message addressed to you with those words. The window navigates nowhere itself, opens no tab, and offers no second mail control.
- **AC-3**: A Copy control sits in the address row beside the address, is reachable by Tab, carries the visible focus ring, and has an accessible name saying what it copies. Pressing it writes `PROFILE.email` and nothing else to the clipboard: no name, no prefix and no punctuation added.
- **AC-4**: The row the press was made in reports the outcome through the shared copy pair: the confirmation line naming the address when the write landed, and the shared quiet line naming the address when the clipboard was absent or refused. Both sets of words come from the shared copy module rather than from this window. The window's one live region says the same words once through the shared announcement, so a screen reader hears exactly what a sighted visitor reads.
- **AC-5**: Pressing Copy on the same address twice changes nothing at all: the state object stays as it is, the row keeps its confirmation without flickering, and the live region has no new word to announce.
- **AC-6**: A refusal throws nothing anywhere and costs the visitor nothing: the address stays on the page as readable, selectable text, the tiles and the mail link stay as they were, and the window shows the refusal as a line rather than as a fault.
- **AC-7**: All four socials are shown, in the order the content lists them, each as one link showing its own icon and its own label, with the label as its accessible name, opening in a new tab with `rel="noopener noreferrer"`. Each icon is decorative, so the meaning never rests on it, and a social whose icon file is missing still shows its label and still works as a link. The icon is drawn in the label's own ink through a mask, the trick the menu bar logo already uses, because the four icon assets are white line drawings and white measures between 2.1:1 and 3.0:1 on the brand colours. Each tile composes the shared focus ring unchanged: its outer layer is drawn 2px outside the tile, on the body surface the suite already holds, and its inner layer is the tile's own surface. Its pointer state is the reference build's small lift, timed through the motion tokens so reduced motion needs no second path, and it composes none of the token wash state utilities, which flip with the mode while the tile does not.
- **AC-8**: Each tile's surface is the brand colour its own entry carries in the content layer, painted onto the element rather than written as a colour inside a window module, and its label is painted with one new ink name, `--color-text-on-brand`, pinned to `#1f2937` and declared once in the theme block under its own name rather than as a reuse of the text token, which flips with the mode. The contrast suite holds the ink against every social colour in both modes, in its own list that reads the social entries and the ink token and leaves the existing token pairs untouched, and each pair clears 4.5:1 for the label text. Two assertions guard the name directly: it is absent from the `[data-theme='dark']` block, and it is absent from the suite's `MODE_DEPENDENT` set. A tile is identified by its own label rather than by its boundary, because three of the four brand colours sit below 3:1 against the light body surface; that shortfall is recorded as an exception in `design.md` beside the traffic lights, so nothing in this window depends on seeing the colour.
- **AC-9**: The availability line comes from the profile's new optional field: it shows when the field is set, and when it is not set the window shows no line and leaves no empty element or leftover space behind.
- **AC-10**: Every word a visitor reads in this window comes from the window's words module, apart from the content layer's own values (the address, the social labels, the availability line and the window title). No component in this window writes a sentence or a control label of its own.
- **AC-11**: At 360px wide the window holds one column with no sideways scrolling: the address row wraps so the Copy control takes its own line rather than clipping, each tile keeps at least `--spacing-touch` (44px) of height, a long label wraps rather than widening its tile, and the address itself wraps rather than overflowing the frame.
- **AC-12**: The body follows the window body standard (spec 0006) exactly: exactly one `WindowStage` with one named content area, no second live region and no padding of its own, no colour literal and no palette utility in any module under `src/windows`, and the registry baseline test green for every entry of `WINDOW_BODIES`.
- **AC-13**: The reference block `#contact` is deleted from `src/index.css` in the same change, and `design.md` records both retired debt and the one exception this window makes (a body painting a colour the token layer does not name, and the fixed ink it is painted against).
- **AC-14**: The content carries the engineer's own details before the feature is called done: `PROFILE.email`, the profile's name and role, the availability line, and the four social urls, with the id of the entry that holds the atom icon renamed `site` and labelled `Website` in place of `platform`. That entry sits second in the content list today, so the list and the tiles read `github`, `site`, `twitter`, `linkedin`; a reorder to put the site last is a separate content edit, not part of this decision. `npm test` passes with the four ids matching `socialIdSchema.options`, and `npm run build` is clean.
- **AC-15**: Nothing else moves and no dependency is added. The window makes no request, touches no storage and sets no cookie, adds no manager action and no frame behaviour, and changes no content schema beyond the optional availability field and the one social id rename. The clipboard stays the only browser API it reaches, and it reaches it through `#lib/clipboard`.

## Decision

**Chosen option**: Option 1, the shared stage with the profile's own address, the copy pair, a mail link written from the words module, and the four brand tiles painted against one fixed ink.

The Contact window is an ordinary body of the shared frame. It reads `PROFILE` and `SOCIALS` from the content layer, shows a heading with a short invitation line, the availability line when the profile sets it, one address row and the four tiles, and holds no state of its own beyond the copy pair. The address is printed and is itself the mail link, so the mailable value and the copyable value are one field with one home. Copy goes through `#lib/clipboard` and the state pair the terminal window introduced (`useCopyText`, `CopyConfirmation`, `copyLines`), so the confirmation appears on the row the press was made in and the stage's single live region announces it once. The mail link's href is built by one pure function from the address and two words functions, so the encoding has one home and one test. Each tile is a single anchor carrying its brand colour from the content as its surface, its icon as decoration, and its label as its accessible name. Nothing animates in this window, and no dependency is added.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `accessibility-inspect` (`accesslint/skills`, `.agents/skills/accessibility-inspect/`) · `accessibility-scan` (`accesslint/skills`, `.agents/skills/accessibility-scan/`) · `playwright-best-practices` (`currents-dev/playwright-best-practices-skill`, `.agents/skills/playwright-best-practices/`)

## Feature design

**Data model sketch**:

No new entity, no new file in the content layer, and no migration (the content is a TypeScript source tree, not a store). One field is added to the existing profile, and one social id is renamed.

| Field it reads | Type | Where it comes from | What it is used for |
|---|---|---|---|
| `email` | string, required, already `z.email()` | `PROFILE` (spec 0001) | the address shown, the value copied, and the mail link's recipient |
| `availability` | string, min 1, **optional** (new) | `PROFILE` (new field) | the availability line, shown only when the field is set |
| `name`, `role` | string, required | `PROFILE` (existing) | nothing in this window; the values are refreshed for the site, and the Finder's About location reads them |
| `label`, `icon`, `href` | string, all required | `SOCIALS` (existing) | a tile's name, its icon, and where its link goes |
| `color` | six digit hex, required | `SOCIALS` (existing) | a tile's own surface, painted onto the element |
| `id` | literal union | `socialIdSchema` in `#content/types` | the `platform` member becomes `site`, and the content entry follows |
| `title` | string | `WINDOWS.contact` | the stage's content area name |

**State transitions**:

The window has no state of its own beyond the copy pair, whose state is the shared three member union. A second press on the same address is deliberately a no op, which is what AC-5 pins.

```text
idle                 → copied        a press, and the clipboard takes the address
idle                 → failed        a press, and the clipboard is absent or refuses
copied (same press)  → copied        the same state object, so nothing re-renders
failed (same press)  → failed        likewise, no second announcement
```

**Interface surface**:

This is a browser only, serverless feature, so the surface is the modules it adds and the one registry line it edits, not endpoints.

| Surface | Kind | Key inputs | Key outputs | Failure |
|---|---|---|---|---|
| `ContactWindow` | window body, `src/windows/contact/ContactWindow.tsx` | the body props (`windowId`, `windowKey`, `target`), unused beyond the stage name | the stage, the heading, the invitation line, the availability line, the address row and the tiles | none: a missing entry in the content cannot compile, and an unset availability field is a state, not an error |
| `SocialTile` | window component, `src/windows/contact/SocialTile.tsx` | a `Social` entry | one anchor carrying the entry's own surface, its icon masked in the label's ink, the label as its name, the shared ring on focus and the small lift under the pointer | a missing icon file leaves the tile intact, since the label carries the meaning |
| `useCopyText`, `CopyConfirmation`, `CopyKey` | reused shared pair (spec 0006) | the row key `address`, the name `PROFILE.email`, and the text to write | the confirmation on the pressed row, and the words the stage announces | the refusal is a value (`unsupported`, `refused`), never a throw |
| `mailLinkHref(address, subject, body)` | pure function, `src/windows/contact/mailLink.ts` | the address and the two words | the `mailto:` href, each carried value percent encoded | none: every value is a string the content layer or the words module supplies |
| `contactLines` | words, `src/windows/contact/contactLines.ts` | nothing, or the address where a line names it | the heading, the invitation line, the mail subject, the mail body, the Copy control's label and its accessible name | none |
| `WINDOW_BODIES.contact` | registry line, `src/windows/WindowBody.tsx` | none | `{ Body: ContactWindow }`, no `Lead` and no `Scope` | a window id with no entry fails the typecheck |

The body ignores the `target` it is handed: the window is only ever opened bare (`{ kind: 'window', windowId: 'contact' }`), from the dock and from the bar, so the target carries nothing to read.

**Value sourcing** (every value the window displays or produces, and where it comes from):

| Value displayed or produced | Source |
|---|---|
| The address shown, the address copied, and the mail link's recipient | `PROFILE.email`, one field read three ways so there is never a second address |
| The mail link's subject and body | the words module (`mailSubject`, `mailBody`) |
| The mail link's href, encoded | `mailLinkHref(address, subject, body)` in `src/windows/contact/mailLink.ts`, which owns the percent encoding |
| The Copy control's label and accessible name | the words module (`copyControlLabel`, `addressCopyName`) |
| The heading and the invitation line | the words module (`headingLine`, `invitationLine`) |
| The availability line | `PROFILE.availability`, and the line is simply absent when the field is unset |
| A tile's name, icon, surface and destination | that `Social` entry's own `label`, `icon`, `color` and `href` |
| The order the tiles appear in | the order of `SOCIALS` in `#content/profile` |
| The window's content area name | `WINDOWS.contact.title` |
| The confirmation words and the refusal words | the shared `copyLines` (`copiedLine`, `copyFailedLine`) |
| The words the live region announces | the shared `copyAnnouncement`, fed from the state the row reads |
| Which row confirms | the shared `CopyKey` row member, `address` |
| The tile ink | `--color-text-on-brand`, a new fixed name in the theme block |
| Every other colour, space, radius and duration | the token layer in `src/index.css` |

**Key invariants**:

- One home for the address: the value shown, the value copied and the value in the mail link's href all come from `PROFILE.email`. No second copy of the address exists in the code or the words.
- No colour is written in a window module: the tile surface is read from the content entry and painted, and the ink comes from the token layer. A raw brand value must not be typed into a component, and no palette utility appears anywhere under `src/windows`.
- The tile ink never flips: the new ink name is declared once in the theme block, is absent from the `[data-theme='dark']` block, and is never added to the contrast suite's `MODE_DEPENDENT` set, in the same way the page set from spec 0007 behaves. Its value is written under its own name rather than reusing the text token, which flips with the mode.
- The brand colour is the one value this window paints from outside the token layer, and nothing else follows it: the ink, the icon, the ring and the pointer state all come from the token layer or from the shared utilities. The tile's state utilities are the shared ring and a movement, never a wash, because every wash utility is built from tokens that flip and the tile does not. The icon and the label share one ink, drawn through a mask, so a brand colour change can never leave an icon that fails to read while its label passes.
- One stage, one live region: the body renders exactly one `WindowStage` with one named content area and adds no live region, no padding and no second heading of its own.
- A destructive surface: this window reads the content layer and the clipboard and touches nothing else. There is no request, no storage, no cookie, no manager action and no frame behaviour.
- Every literal a visitor reads lives in the words module, named for what it says rather than for where it sits.

**Security model**:

There are no accounts, no sessions and no server. The window reads public portfolio content and offers public links. The address is deliberately plain text (the engineer's choice, recorded in `options considered`), so it can be read aloud, selected by hand and copied by a visitor whose clipboard is blocked; that choice also leaves it open to address harvesters, which is accepted. The clipboard is written to on a press only, is never read from, and stays behind `#lib/clipboard`, which answers a value rather than throwing. The mail link's carried values are percent encoded by the one function that builds the href, so a word added to the subject or the body later can never break out of the href or smuggle a second header into it. Outbound social links open in a new tab with `rel="noopener noreferrer"`, matching the project's link files, so the opened page gets no handle on this one. Nothing in the window is typed by a visitor, so there is no input to validate beyond the content schemas, which already hold the address as an email and each social link as absolute https.

**Configuration required**: none. No environment variable, no credential and no third party account. The window is added by code and content alone.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: the dock's Contact button opens the window, the heading, the invitation line, the address row and the four tiles are all in the DOM, the address is one anchor whose href starts `mailto:` and carries the profile's address, and pressing Copy writes the same address and shows the shared confirmation on that row, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**
- Failure case: the clipboard is absent or refuses the write (a stub returning `unsupported`, then one rejecting), so the shared quiet line names the address, nothing throws and the address is still on the page as text, verifies **AC-6**
- Repeat press: two presses on the same address leave the same state object and announce nothing the second time, verifies **AC-5**
- Content edge: the availability field unset leaves no line and no empty element, and set, it shows the words verbatim, verifies **AC-9**
- Accessibility: the tab walk reaches the mail link, the Copy control and the four tiles in reading order, each with the visible ring drawn outside it on the body surface, each tile's accessible name is its label alone, and each icon is drawn in that same ink through a mask, verifies **AC-7**, **AC-11**
- Colour: the contrast suite holds the new ink against every social colour in both modes, verifies **AC-8**
- Narrow width: at 360px the address row wraps, every target keeps its height and the frame reports no sideways scroll, verifies **AC-11**
- Registry baseline: the body renders one stage and one named content area, and no module under `src/windows` carries a colour literal or a palette utility, verifies **AC-12**

## Build plan

Ordered as the project's approach asks (Tracer Bullet): the smallest real thread runs all the way from the content to the rendered window first, then each strand thickens it, and the contrast work and the content values land on a thread that already works end to end.

1. The content and the words: the optional `availability` field on the profile schema and its value, the `platform` social id renamed `site` (schema, content entry, label `Website`), and `src/windows/contact/contactLines.ts` with the heading, the invitation line, the mail subject, the mail body, the Copy control's label and the address's accessible name, satisfies **AC-9**, **AC-10**, **AC-14**
2. The thin thread: `ContactWindow` on one `WindowStage` with the heading, the invitation line, the address row and one tile straight from the content, plus the `WINDOW_BODIES.contact` line, proved from the dock button and the menu bar link, satisfies **AC-1**, **AC-2**
3. The copy pair: the Copy control in the address row through `useCopyText`, `CopyConfirmation`, the shared words and the stage's `status`, including the refusal path, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**
4. The tiles: all four socials in content order as single links, each icon drawn through a mask in the label's ink, the label as the link's name, the new tab and the rel, with the shared ring on focus and the small lift under the pointer, satisfies **AC-7**
5. The availability line: shown only when the field is set, with no leftover element when it is not, and a pass over the body for any literal that belongs in the words module, satisfies **AC-9**, **AC-10**
6. The ink and the suite: `--color-text-on-brand` declared once and never flipped, the tile surfaces painted from the content, the contrast suite extended to hold the ink against every social colour in both modes, `#contact` deleted from `src/index.css`, and `design.md` recording the retirement and the exception, satisfies **AC-8**, **AC-13**
7. Narrow widths, the keyboard path and the suites: the 360px one column behaviour and the wrapping, the tab walk and the focus rings, the body's own tests, `windowBodies.test.tsx` still green, and `e2e/contact.spec.ts`, satisfies **AC-11**, **AC-12**
8. The values and the clean run: fill `PROFILE.email`, the name and the role, the availability line and the four social urls, then land `npx tsc -b`, `npm run lint`, `npm test`, `npm run build` and `npm run test:e2e` clean, satisfies **AC-14**, **AC-15**

## Consequences

**Positive**:

- A recruiter reaches you in one press from the dock or the bar, and the address is taken in one more.
- The address has one home, so a change to it moves the printed address, the copied value and the mail link together.
- The window adds almost no mechanism: the stage, the copy pair, the clipboard edge and the content layer all already exist, so the whole feature is one body, one tile component, one words module and one small function.
- The brand colours stay in the content, where they belong, and the contrast bar is held by the suite rather than by review, which is stronger than the reference build achieved.
- The last reference block for this window is retired, so `src/index.css` shrinks and `design.md`'s tracked debt gets smaller.

**Negative / tradeoffs**:

- The atom icon entry's id is renamed, which touches a literal union in `#content/types`, its content entry and the content suite, and a future rename costs the same again.
- A new brand colour is a two place change: the content entry and the suite's list of pairs.
- A prefilled mail body writes words on the visitor's behalf. It makes sending easier and takes a little of their voice, which is the tradeoff accepted here.
- The tiles keep the reference build's colour, and three of the four brand colours sit below 3:1 against the light body surface, so the tiles are identified by their labels and the shortfall is recorded as an exception rather than fixed.
- The availability line is a second promise to keep current, and a stale one is worse than none.
- The address stays plain text, so address harvesters can find it. That was chosen over obfuscation, which would have cost the hand selection and the screen reader reading.
- The mail link's behaviour belongs to the visitor's mail app, which a page cannot detect: a visitor with no mail app configured gets nothing from that press, and the only fallback is the address and the Copy control beside it.

**Neutral**:

- The profile's name and role are refreshed for the site but are not read by this window; the Finder's About location and the profile's avatar continue to read them.
- The window reads a content entry the Finder's About location also reads, so a profile change is felt in two places by design.
- The tile colours do not follow the mode, which is what the fixed ink is for.
- This window carries no metadata, no structured data and no social card. That is the metadata and social cards feature (scope row 17), not this one.

## Follow-up

- [ ] Fill the engineer's own values before the feature is called done: `PROFILE.email`, the profile's name and role, the availability line, and the four social urls, with that entry's own id, label, icon and colour chosen for the real link.
- [ ] Add an icon to `public/icons` for that entry if the existing atom icon no longer suits what it becomes.
- [ ] Revisit the plain text address if harvester spam becomes a real problem. The decision and its tradeoff are recorded in this spec, so the change is a small edit to the address row plus a note here.
- [ ] The tiles' boundary contrast in light mode is recorded as an exception in `design.md`. If a future brand colour is a token, that exception can be closed properly.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
