# 0002 rationale and evidence

Companion to [index.md](index.md). This file holds the reasoning, the options weighed, and the evidence from the code as it stands. `/develop` does not need it.

## Context

The desktop has to look like one thing. Right now the visual language exists only as fourteen ported component rules in `src/index.css`, written for the reference build, with no names, no mode, and one focus rule in the whole file. Several windows are still to come (rows 8 to 15), and each of them will style itself. Without a shared set of names and one frame, those windows will each invent a colour, a radius and a shadow, and the desktop will drift.

Three forces make this urgent now rather than later. The first is that a mode cannot be retrofitted one window at a time; the colour decision has to exist before the windows do, or every window gets a second styling pass. The second is the accessibility bar in `AGENTS.md`, which every window has to meet, and focus is currently applied to exactly one control in the codebase. The third is that the visual reference is already in the repo as twenty five images in `designs/`, covering nine surfaces in light, dark and a mobile take, so the target look is not in question.

The topic touches three scope rows: this one (row 5), the appearance control (row 16) and the mobile shell (row 12). The boundary taken here is that this feature owns the shared layer (the values, the mode resolution, and the frame) and later features own the surfaces that use it. Both sets of values ship now rather than in row 16, because values that nothing renders cannot be verified.

> ⚠️ Premise note: the standard will be true of the code that exists and false of the code that does not. The fourteen ported window rules stay palette based until each window lands, so for a while the repo holds two contradicting ways to style a window, side by side in one file. The failure mode is concrete: a window feature copies `bg-gray-50` and `border-gray-200` from the rule next to it and quietly reintroduces a colour that cannot follow the mode. The answer taken is to say so out loud rather than to pretend otherwise: `design.md` states that the ported rules are reference only and not yet migrated, and must not be copied, the rollout rule in the standard sends each window feature to migrate its own rules, and the remaining rules are deleted once every window is built. A cheaper alternative (delete all fourteen now) was considered and rejected because the rules carry real design detail that the window features read from, and because writing fresh rules for a window that does not exist yet is guesswork.

## Options considered

The standard itself was settled in the design conversation. What remained open was how strongly to enforce it and how to roll it out, which is where the options differ.

### Option 1: define the standard, ship the tokens and the chrome, enforce going forward

Ship the token list, the chrome primitives, the mode resolution and the contrast suite. New code complies immediately; the menu bar migrates now because it is the only real surface; each window feature migrates its own ported rules when it lands.

**Pros**:
- The automated guard (the contrast suite) arrives in the same change as the tokens it guards, so the bar cannot drift from day one.
- The migration happens once per window, by the person who already knows that window's markup, so no work is spent on rules whose window does not exist.
- The thread is complete early: tokens, mode, a real surface and a proof, all in one feature.

**Cons**:
- Two styling standards coexist for the length of slices 1 to 4, so a copy of an old rule is possible and only review catches it.
- The contrast suite only covers the pairs in its list, and the list grows by hand as windows land.

### Option 2: define the standard, then migrate every ported rule in one change

Same standard and same tokens, plus one coordinated change that rewrites all fourteen window rules onto semantic tokens.

**Pros**:
- One styling standard in the repo as soon as the change lands, with no window of contradiction.
- The ported detail gets worked out again while the design images are fresh.

**Cons**:
- Thirteen of the fourteen rules have no markup that renders them, so the migration is unverifiable work: nothing can be looked at to check the tokens were chosen well.
- The rules are almost certainly wrong in shape for the windows that will use them (a sidebar and a toolbar need slots this spec defines), so most of the migration would be redone anyway.
- It is the opposite of the project's approach, which stands up a thin working thread before thickening it.

### Option 3: document the standard only

Write `design.md`, define the tokens in prose, and let each window reach for them by convention.

**Pros**:
- Smallest change, no new dependency, nothing to keep in step.

**Cons**:
- Nothing enforces the colour pairs, so the AA bar depends on review alone, in a project whose stated baseline is a test.
- The frame and the mode resolution would still have to exist somewhere, so the saving is small and the risk is concentrated in the accessibility bar.

## Rationale

**Option 1, with the rollout bound to the window that lands.** The deciding force is that only three of the fourteen ported rules have a surface to look at, which makes a bulk migration unverifiable work, and this project's approach is to stand up a working thread before thickening it. The cost is real and stated: two standards coexist for a while. What makes that acceptable is that the guard arrives with the tokens, so the direction of travel is enforced even where the old rules still sit.

**`@theme static`, not plain `@theme` and not `@theme inline`.** Three behaviours were weighed. Tailwind drops a theme variable that no generated utility references, which this repo's own notes already record, and two tokens here are read only through `var()` in author CSS: the ground colour in the base layer and the inner shadow of the focus ring. Under plain `@theme` both would vanish from the built stylesheet while the dev server looked correct, which is the worst kind of failure because it only shows up in production. `@theme inline` has the opposite problem: it bakes each value into the utility, so the mode swap cannot work at all. `@theme static` ships every variable, still emits the utilities through `var(...)`, and leaves the swap intact. The cost is a slightly larger stylesheet and no longer getting an unused token pruned for free. Runner up: plain `@theme` with every token also consumed through a generated utility in an `@apply`, which keeps the pruning but makes the base layer depend on a class existing rather than on the token.

**The ring's implementation is pinned rather than left open.** A two layer ring needs the inner layer to sit outside the outer one, and the only way to do that without a wrapper element is an outline for the outer edge plus a box shadow for the inner one. Forced colours strips box shadows, so the ring would silently lose a layer for a visitor who runs Windows high contrast, which is why the forced colours override is part of the decision rather than a later polish. The pinned colour pair carries the measured failure too: `blue-600` on the translucent bar is 1.58:1, and `blue-950` is 4.41:1 with a 3.71:1 worst case, so the light mode outer ring starts from `#1e3a8a`.

**The contrast suite composites rather than pretending.** Three of the pairs sit on glass over an image, and the suite reads token values, so it has no wallpaper to composite against. Leaving those pairs out would drop the bar's own text and the ring from the check, which are the two the bar depends on. Holding a worst case wallpaper tone per mode as a fixture keeps the pairs checked and keeps the suite honest about what it assumes, and the assumption is written down where a later reader will find it. Making the text tokens opaque is what keeps the rule simple: only a background ever composites.

**A `data-theme` attribute rather than a `dark` class.** The attribute states what the mode is rather than what the stylesheet should do, it reads correctly in a DOM inspection, and it leaves room for a third value when row 16 adds an explicit `system` choice. The runner up, Tailwind's `@custom-variant dark` over a `.dark` class, is the more familiar convention and slightly less explicit.

**`data-theme` written by a small script in `index.html` rather than by the module.** A module reached through `main.tsx` is deferred, so the browser can paint the fallback background before the attribute lands, which is visible as a flash to anyone whose mode is dark. A short blocking script in the head is the standard answer, and the price is that the storage key appears twice. That price is paid down by a test that compares the two literals, so the pair cannot drift silently.

**Three faces rather than two.** The home screen's display line is a script face in the design images, and a face that has no token will be inlined by row 6. The pick is Great Vibes: a thin, elegant script that matches the images, freely licensed, and available as `@fontsource/great-vibes`. Runner up: Dancing Script, which is heavier and reads more casual than the images. If the face turns out to be wrong, it is a one line change to `--font-display`.

**A disabled light rather than a dead one.** The frame ships before the window manager, so three buttons would exist with nothing behind them. Rendering them `disabled` keeps the picture and tells the truth in the accessible tree, and because the light colours are a picture of a window rather than an expression of state, the disabled styling does not change them. Runner up: decorative spans until row 7, rejected because a window whose controls are decorative is a lie in the other direction.

**Self hosted fonts through `@fontsource`.** The current Google Fonts import is a render blocking request to a third party, and it makes the type swap visible on a slow connection. Self hosting through npm packages removes the third party, works when the preview build is opened offline, and keeps the licence bookkeeping in the dependency rather than in a folder of files. Runner up: downloading the woff2 files into `public/fonts/` by hand, which is the same benefit with a manual step and a licence file to maintain. One earlier answer was revised here: the pack of self hosted faces was to be preloaded, and a hand written `<link rel="preload">` cannot name a file Vite hashes, so the fallback stacks plus the swap `@fontsource` already sets are the accepted mitigation, with a small Vite `transformIndexHtml` plugin noted in Follow-up as the way back if a measurement ever justifies it.

**The paper surface as a named exception.** The dark images show a dark Terminal and a dark Finder, and a white Resume in the same set, because a resume is a page. Naming `--color-surface-paper` records the exception where a reader will find it, rather than letting row 10 hardcode white and start a second standard.

## Evidence: the current state

Sampled from `src/index.css` (404 lines), `src/App.tsx`, `src/components/Navbar.tsx`, `src/main.tsx` and `src/content/`.

| What was looked at | What it shows |
|---|---|
| Theme tokens declared | Three: `--font-georama`, `--font-roboto`, `--breakpoint-3xl`. No colour, radius, shadow, spacing or motion token exists. |
| Palette families inside component rules | `bg-white` on nine window rules, `bg-gray-50` on the title bar and both sidebars, `text-gray-400` and `text-gray-500` on titles and subtitles, `border-gray-200` on sidebar and title bar rules, `bg-blue-100 text-blue-700` on a selected row, `bg-gray-950/10` on an icon hover. |
| Colours written as literals | Five: `bg-[#ff6157]`, `bg-[#ffc030]`, `bg-[#2acb42]` (the lights), `text-[#00A154]` (the terminal, twice), `text-[#5f6266]` (an image title). |
| Focus rules | One, `nav button:focus-visible`. The fourteen window rules have no focus state at all. |
| Mode machinery | None. No `dark:` variant, no `.dark`, no `data-theme`, no `prefers-color-scheme`. |
| Translucency | Three levels used ad hoc: `backdrop-blur-3xl` with `bg-white/50` on the bar, `backdrop-blur-md` with `bg-white/20` on the dock, `backdrop-blur-lg` with `bg-red-300/20` on the small screen note. |
| Radius steps in use | Five: `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`. |
| Depth | `shadow-2xl drop-shadow-2xl` doubled on nine window rules, `shadow-2xl!` on the dock tooltip. |
| Breakpoints | Tailwind's defaults plus `--breakpoint-3xl: 1920px`; `max-sm:` used in three places to hide the dock, the welcome text and the menu bar's right group. |
| Wallpaper | One path, hardcoded in the `html, body` rule, with `background-size: cover` and no fallback colour. Three are needed. |
| Measured contrast failure | `blue-600` on the translucent bar measures 1.58:1 against the wallpaper, and `blue-950` measures 4.41:1 (3.71:1 worst case). The bar is a 3:1 surface, so the current focus colour is the one pair that already fails. |

Two build behaviours of Tailwind 4 that shape the plan, both already recorded in the repo notes and reconfirmed here: `@theme` values and `@utility` custom utilities are emitted only when used, so an unused token is absent from the built CSS and that is expected rather than a failure; and a focus ring applied through `@apply` inside `@layer base` sets `--tw-ring-shadow` while painting nothing, so the ring is built from outline utilities instead.
