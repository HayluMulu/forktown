# Founding edition verification

Verified locally on September 20, 2026 with Node.js 24.19.0.

## Automated checks

- `npm run check`: 51 tests passed; all nine places (eight starters and the first contribution) validated; TypeScript and the production build passed.
- `npm run format:check`: passed.
- Contribution tests cover duplicate plots and ids, invalid fields, filename conventions, international text, incomplete drafts, stable coordinates, hit detection, and composed night colors.
- Publishing tests cover project paths, user-site roots, custom-domain overrides, and malformed configuration.
- Local save tests exercise real HTTP requests and temporary folders: file creation, formatting, duplicate files, stale plot claims, simultaneous saves, invalid data, malformed or oversized requests, local origin/session checks, and production disabling.

## Browser checks

- Inspected the full desktop layout and the 390px and 320px responsive layouts.
- Selected a building directly on the Canvas map and through the directory.
- Checked open plots, empty search results, day/night controls, zoom, and reset.
- Customized a building and verified the exported JSON through both the clipboard and the downloaded file on disk.
- Added that downloaded file to `places/` and verified its creator credit and direct share link in the city. Removed the temporary contribution afterward; the project retains its eight starter places.
- Checked the local preview, saved unfinished draft, friendly username error, and focus moving to the invalid field.
- Corrected narrow-screen building labels, sticky dialog controls, night roof colors, preview/source duplication during development, and illustration bounds.
- Loaded a production build from `/forktown/` and opened a direct link to the observatory, confirming the GitHub Pages-style subpath works.
- Used **Continue to save → Save to my project** in the browser. Confirmed the new JSON appeared in `places/`, the city updated from eight to nine places, the save confirmation stayed visible, and **See my place in town** opened its details after a reload. Confirmed the next builder draft was fresh. Removed the temporary test file afterward.

## GitHub and publishing

The initial foundation was pushed to the private `renanbazinin/forktown` repository. Its first **Check town** workflow passed; **Publish town** was skipped because publishing is opt-in. The local-save follow-up and `renanbazinin`’s first contribution, **My Little Place** on plot A1, have passed the local checks above.

Public Pages deployment and an actual fork-to-pull-request-to-published-city cycle still need verification. The current browser preview is local only.
