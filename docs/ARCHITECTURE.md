# How Forktown fits together

## A static city, built from reviewed files

Place JSON files → shared schema validation → Vite static build → React interface + Canvas city.

The browser imports bundled place data. There is no database, GitHub API dependency, login, or runtime fetch of contributor repositories. Merging a contribution changes the next build of the town. Forks work on their own and may be hosted separately.

### Why React, TypeScript, and Canvas?

React manages the directory, forms, native dialogs, and contribution state. TypeScript makes renderer and data changes easier to follow. Canvas provides a compact, original isometric world without a game engine. The complete contributor entry point remains a small JSON file; contributors do not need to learn the app stack.

### The contribution boundary

`src/lib/schema.ts` is the source of truth for fields and bounds. The CLI, app loader, and editor all reuse it. Files have stable ids and names; the loader discovers `places/*.json`, so contributors never touch an index. Duplicate ids and occupied plots fail the build. Strings are rendered as text; contribution files cannot provide HTML, scripts, external assets, or URLs.

Schema validation does not prove creator identity, story suitability, or authorization to modify an existing place. Those are part of maintainer review. No contribution is automatically merged. Checks run without repository write permissions or secrets.

### Stable world positions

`world.ts` owns 25 named plots with explicit coordinates. A place’s location depends only on its `plot`. Adding a file, changing names, or sorting a directory does not move other buildings. Empty plots can be selected on the map or through the directory.

Plots are not reservations. Concurrent pull requests can conflict; re-run checks against the current main branch before merging. Enable required status checks and require branches to be up to date (or use GitHub’s merge queue) when you publish.

### Rendering

`render.ts` draws locally authored geometry for terrain, six building families, vegetation, decorations, and day/night lighting. The renderer is deterministic: decorative variation uses a stable hash. Depth sorting follows isometric coordinates. It draws only on state, viewport, or pointer changes and uses a capped device pixel ratio. No animation loop runs while the city is idle.

`City.tsx` owns the camera and input. The directory is an equivalent keyboard route to the places and empty plots; the map itself supports arrow keys, plus/minus, and Home. Canvas artwork is supplementary to textual place details.

### Private previews and persistence

The builder stores its fields under `forktown-draft-v1` in localStorage. Storage and clipboard failures have fallbacks. Draft validation allows unfinished text while keeping rendering choices valid. Saved drafts, including incomplete usernames or stories, are restored next time the builder opens. If their plot is now occupied, the editor chooses another available plot. A submitted local preview exists only in React state for the current visit, is labeled as local, and never changes source files or the public town.

Share links use `#place=id`, so static hosting needs no rewrite rules. Deep links work on root and repository subpaths. GitHub links are shown only after a valid `VITE_GITHUB_REPOSITORY=owner/repo` is set. The initial `forktown` creator is a clearly labeled starter credit, not a claimed contributor profile.

## Where to extend it

- **Building family:** add an enum member and label in `schema.ts`, add its geometry in `drawBuilding`, and consider its selection bounds in `buildingHit`. The editor discovers enum values automatically.
- **Decoration:** extend the enum and renderer.
- **District:** define a versioned plot convention before extending beyond the first 25 plots. Keep existing ids and coordinates stable. Update the schema, available plot list, and tests together.
- **Custom art or interactive interiors:** introduce a separately reviewed, bounded interface; do not execute arbitrary contributor files in the shared application.
- **Languages:** move UI strings to locale dictionaries while leaving place stories as their authors wrote them.
- **PR previews:** CI currently uploads a build artifact. A hosting service may add per-PR preview URLs later. No temporary public preview infrastructure is assumed.

## Current boundaries

One founding neighborhood, six building styles, four decorations, eight seed places. Mobile supports touch drag and zoom buttons; multi-touch pinch zoom is not implemented. The contributor directory is the accessible way to browse Canvas content. There is no long-term plot reservation, automated account verification, multiplayer, persistent user backend, or content moderation service.
