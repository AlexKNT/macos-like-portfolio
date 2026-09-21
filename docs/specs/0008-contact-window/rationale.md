# Rationale: the Contact window: how a visitor reaches you

The reasoning behind spec 0008, kept out of `index.md` so a build never loads it. Read this to understand why the window is shaped the way it is.

## Context

Scope row 11 asks for the third of the core content windows: how a visitor reaches you with no server involved. Its own words are an address with a copy control, a mail link and your socials. The window is still the placeholder body, so today pressing Contact in the dock or the bar opens a frame with a line of stand in text in it. For the window a recruiter reaches for first when they are interested, that is the empty end of the desktop.

The material is already in the repo. The profile holds the address as a validated email, the four socials hold their labels, icons, brand colours and destinations, and the desktop's shell already points at this window from two places. What is missing is the window itself, and one piece of design work: the reference build paints each social tile in its own brand colour with white text on it, and it does so outside the token layer.

Three forces shape the decision. The first is the project's own body standard (spec 0006): a window body is a pure function on the shared stage, it paints nothing but tokens, and every literal a visitor reads lives in one words module. The second is the accessibility bar, which is a project rule rather than a preference: the contrast suite holds the pairs, and a control whose boundary is the only thing marking it uses a colour checked at 3:1. The third is the front end only line: no server, no database and no third party form service, which rules out the one shape a contact window usually takes elsewhere.

There is also standing debt to clear. `src/index.css` still carries the reference build's `#contact` block, marked reference only in `design.md`, palette based and light only, with the standing instruction not to copy it as it stands. Each window feature retires its own block; this is the one this feature owns.

## Options considered

### Option 1: the shared stage, the profile's address, the copy pair and the four brand tiles

The window is an ordinary body of the shared frame. It reads the address and the social entries out of the content layer, prints the address as the mail link itself, puts the shared Copy control beside it, and paints each tile with the brand colour its entry carries against one new ink name that never flips, pinned at `#1f2937`.

**Pros**:

- The address, the copied value and the mail recipient are one field, so they cannot drift apart.
- Almost nothing is new: the stage, the copy pair, the clipboard edge and the content entries already exist, so the feature is one body, one tile, one words module and one small function.
- The brand colours stay in the content, where a designer or the owner can change them, and the contrast bar is held by the suite instead of by review.
- Retires the `#contact` debt with the window it belongs to, on the pattern the Finder, the terminal and the resume already followed.

**Cons**:

- The tile surfaces are content colours, so the token layer does not name them and the suite has to reach into the content to hold the pairs.
- Three of the four brand colours sit below 3:1 against the light body surface, so the tile is identified by its label rather than by its boundary, and that shortfall has to be recorded as an exception.

### Option 2: token surfaces only, no brand colours

The tiles are painted from the token layer like every other control, and the brand survives only in the icon.

**Pros**:

- Every pair is an ordinary token pair, so the suite holds the whole window with nothing new.
- Nothing in the window reaches outside the token layer, so `design.md`'s rule needs no exception at all.

**Cons**:

- It loses most of what makes the reference design read at a glance. For a visitor scanning a contact window a second time, colour is the fastest way back to the link they want.
- It would leave the content's colour field unread, which is a second truth problem in reverse: a field no window reads.

### Option 3: migrate the reference build's `#contact` block as it stands

Keep the ported rules, lift them onto the tokens where a token exists, and paint white text on the brand tiles as the reference does.

**Pros**:

- Closest to the reference screenshots, and the least design work up front.
- The markup shape is already written down in `src/index.css`.

**Cons**:

- White on the four brand colours measures between 2.1:1 and 3.0:1, so every tile label fails the bar the project holds everywhere else.
- The block is palette based and light only, so carrying it forward means two colour systems in one app, which is exactly the debt `design.md` marks as tracked rather than designed.

### Option 4: a form service, so a visitor writes in the window

The tiles stay, and the address row becomes a small form that posts to a hosted form service.

**Pros**:

- A visitor with no mail app configured can still reach you, and the message arrives in one place.
- It turns the hardest case (a phone with no mail client) into a working path.

**Cons**:

- It breaks the front end only line and adds a third party to the page, with its script, its terms and its own privacy surface.
- A form that silently discards a message, or that the service rate limits, is a worse experience than an address the visitor can copy and a line saying the copy failed.

## Rationale

Option 1 wins on the project's own forces rather than on taste. The front end only line and the two clicks already in place from the desktop shell mean the window's job is presentation: show the address, make it takeable, make it mailable, and show the profiles. The content layer already holds every value, so the decision is really about where the colours and the words live, and Option 1 answers both with the house pattern: values in the content, words in one module beside the body, colours in the token layer except where a colour is content.

The tile colours are the one place where those two homes collide, and Option 1 resolves the collision rather than avoiding it. A brand colour is content, so it stays in the content entry, and the window paints it. What the token layer owes the window is the ink, because the ink is what has to clear the contrast bar, and the ink does not change per brand: one fixed dark value clears 4.5:1 on all four colours while white clears none of them (the figures are below). Holding the ink fixed also means the tiles need no dark mode variant, since the surface is the same colour in both modes by design. Option 3 was rejected on exactly that measurement: the reference look is affordable, the reference ink is not.

Option 2 is the honest alternative and would be the pick on a project with no reference design to honour, since it needs no exception in `design.md`. It loses here because the reference screenshots are the design source the engineer chose, and because reading a brand colour from the content is a smaller exception than leaving a content field unread. Option 4 is rejected on scope: it is a different feature with a different risk shape, and nothing in this window's job needs a server.

Two smaller calls are worth naming, because a build could reasonably go the other way. The address is printed in plain text and is itself the mail link, chosen over a separate `Email me` control: one name for the link, one value on the page, and a visitor whose clipboard is blocked can still select it by hand. The mail subject and body are written here rather than left to the visitor: it makes sending one press, and it does put a sentence in their mouth, which is the tradeoff the engineer accepted. Both are recorded as decisions in `index.md` rather than as preferences, so a later change is a spec change.

## Evidence: the tile contrast figures

Computed with the WCAG relative luminance formula (the sRGB channels linearised, then weighted 0.2126, 0.7152, 0.0722) from the values in `SOCIALS` and the app's own surface and ink tokens. The suite should hold the ink row and, if wanted, the boundary row, but the numbers are here so the exception in `design.md` rests on measurement rather than on a claim.

| Brand colour | With the fixed ink `#1f2937` | With white ink | Against the light body surface `#ffffff` | Against the dark body surface `#1e1e1e` |
|---|---|---|---|---|
| `#f4656b` (github) | 4.84:1 | 3.03:1 | 3.03:1 | 5.49:1 |
| `#4bcb63` (the atom icon entry, `platform` becoming `site`) | 7.04:1 | 2.09:1 | 2.09:1 | 7.98:1 |
| `#ff866b` (twitter) | 6.21:1 | 2.37:1 | 2.37:1 | 7.04:1 |
| `#05b6f6` (linkedin) | 6.31:1 | 2.33:1 | 2.33:1 | 7.16:1 |

What the table says:

- The fixed dark ink clears 4.5:1 for label text on all four colours, so the labels are readable in both modes with one name and no dark variant.
- White ink, which the reference build uses, clears nothing: it fails 4.5:1 on every one of the four.
- The same numbers serve as the boundary reading against the light body surface, since white is the light surface. Three of the four fall short of 3:1 there, which is why the tile is identified by its word as well as by its colour and why the shortfall is recorded as an exception.
- Against the dark body surface every tile clears 3:1 comfortably, so the shortfall is a light mode question only.
