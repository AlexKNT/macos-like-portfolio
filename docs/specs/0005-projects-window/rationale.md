# 0005. Projects window: rationale

_Reasoning, options and context for [index.md](index.md). `/develop` does not need this file._

## Context

> ⚠️ Premise note: the scope row is one window, and the spec ends up owning three window bodies. The two file windows (`textFile` and `imageFile`) are what the Finder opens whenever a visitor presses a file, and no other row owns them. Framing them as three decisions would buy three specs for one question, since a text body and an image body are a heading, some paragraphs, an image and a caption. So they stay here, with the pitch rendered by one component that both the detail view and the text window use. The row that does own those two windows later, if any, inherits bodies rather than placeholders.

The desktop already has a shell, a frame and a window manager. What it does not have is a single window with real content in it, and the wiring that a real body needs is different from the wiring a placeholder needs. A placeholder is handed its own window id and nothing else, because that is all it needs: it renders a line of text. A Finder style window needs to know which place it is showing, it needs to change that place and be changed from outside, and it needs to put a control in a title bar it does not own.

Three forces shape that. The first is the model in `src/content/locations.ts`, which is already the whole tree: four locations, three project folders, their files, and each file typed by its kind with its `alt` text and its outbound link. Nothing about the data is missing, so the window is a rendering problem rather than an authoring one. The second is spec 0004's rule that a `location` or a `project` target resolves to the single `projects` key, which means browsing already re-targets one window rather than opening more, and the window does not have to invent navigation state to get that. The third is the accessibility baseline: in place navigation that repaints the content area takes a keyboard visitor's place with it, so a place change has to hand focus somewhere deliberate.

The smaller forces are the ones that decide the shape. Every tree entry carries a `position` Tailwind class today, authored for the reference build's absolutely placed icons, and nothing reads it, because the desktop carries its own spots in `DESKTOP_ITEMS`. The scope row asks for sensible empty and missing states, which with a typed content layer means a place with nothing in it and an asset that never arrived, not a bad request. And the two file kinds a visitor will actually press most, the text file and the screenshot, are windows rather than surfaces inside the Finder, which is what the manager already models.

## Options considered

### Option 1: One Finder style window whose place is the manager's target and whose history lives in the window

The window reads the place from the instance's `target`, and every press on a sidebar row or a folder dispatches the manager's existing `open` action with that place as the target. The window keeps a small stack of places of its own so the Back control can pop one step, and hands focus to the content region on each change. The two file windows are built in the same pass, because the Finder opens them.

**Pros**:

- One source of truth for what a window shows: a minimised window comes back showing its place, because the place was never anywhere else.
- The manager gains no action, no field and no test for navigation, so the risk sits in one window rather than in the shared model.
- The Back control is the only piece that has to know the history, and it is a handful of pure functions plus a provider.
- The two file windows reuse the frame, the registry and the pitch component, so they cost little.

**Cons**:

- Closing the window forgets the history, and a re-open starts at `Work`.
- A title bar control owned by the body needs a slot the shell does not have yet, so one small mechanism lands in `ManagedWindow`.
- Each window body that later needs its own toolbar pays for that mechanism a second time before it earns its keep.

### Option 2: A `navigate` action, with the place and the history on the instance

The manager gains a `navigate` action and a `history` list on `WindowInstance`, so Back is a manager action and the history survives a body remount.

**Pros**:

- One place for every navigation rule, tested without a render, in the module that already owns what a window shows.
- The history outlives the body, so it survives a future re-mount and is readable by anything that has the manager.

**Cons**:

- The manager's model grows a field that only one window uses, and every manager test that builds an instance has to carry it.
- Two ways to change what a window shows (`open` and `navigate`) invite a caller to pick the wrong one.
- It buys durability for a state that is deliberately short lived: a closed window starts over anyway.

### Option 3: One window per project, with the Finder as a launcher

The Finder stops being a browser and shows the three projects, and each project opens its own window keyed by the project id, with the project's files inside it.

**Pros**:

- Two projects can be read side by side, which suits comparing work.
- Each window keeps its place by construction, so there is no history to build.

**Cons**:

- Breaks the rule the manager just settled: a `project` target resolves to the `projects` key, so this option rewrites the resolver table and its tests.
- A desktop of six windows to read three projects, on a surface a recruiter is scanning in seconds.
- The sidebar, and the reference screenshot's whole shape, stop meaning anything.

### Option 4: No file windows, everything inline

The project detail view renders the pitch, the screenshot and the links in one page, and the two file windows stay placeholders for a later feature.

**Pros**:

- The smallest amount of new surface, and no second and third body to build.
- A visitor reads the whole case study in one place with no extra press.

**Cons**:

- Breaks the metaphor the shell is built on: a file icon that opens nothing, in a desktop whose whole promise is that pressing things opens things.
- Loses the file a visitor can keep: an image window is where a screenshot is worth looking at properly.
- Leaves two window ids with no body at all, so the flow a recruiter takes is the one that ends in a placeholder.

## Rationale

Option 1 wins because of where the state already lives. The manager settled in spec 0004 that a `location` or `project` target re-targets one window, which is exactly the navigation the Finder needs, so the window can be a pure function of its target and the only new state is the history that Back needs. Option 2 moves that history into the shared model, where it costs every manager test and gives the manager a concept that belongs to one window, for durability nobody asked for. Option 3 discards the resolver rule this feature was designed to use, and pays for it with a desktop full of windows. Option 4 is cheaper but leaves a file icon that opens nothing, which contradicts the reason the frame, the reference build and this window exist.

Two calls were made inside that decision rather than asked. The pitch is the project's own text file rather than a second copy on the folder, because a copy is a thing that goes stale, and one component can serve both the detail view and the text window. And the file windows are built here rather than left as placeholders, because the Finder's whole job is to open things, and the flow that a recruiter follows is the one that would otherwise end in a placeholder. The cost is the one new shell mechanism, a body that supplies its own scope and its own title bar control, and it is the same mechanism the remaining content windows will want.

The known cost of the choice is honest and small: a closed window forgets where a visitor had been. Finder itself behaves the same way, the row's intent is a browsable tree rather than a session, and the alternative was a field on every window instance in the manager.
