# Founding edition verification

Verified locally on September 20, 2026 with Node.js 24.19.0.

## Automated checks

- `npm run check`: 33 tests passed; all eight starter files validated; TypeScript and the production build passed.
- `npm run format:check`: passed.
- Contribution tests cover duplicate plots and ids, invalid fields, filename conventions, international text, incomplete drafts, stable coordinates, hit detection, and composed night colors.
- Publishing tests cover project paths, user-site roots, custom-domain overrides, and malformed configuration.

## Browser checks

- Inspected the full desktop layout and the 390px and 320px responsive layouts.
- Selected a building directly on the Canvas map and through the directory.
- Checked open plots, empty search results, day/night controls, zoom, and reset.
- Customized a building and verified the exported JSON through both the clipboard and the downloaded file on disk.
- Added that downloaded file to `places/` and verified its creator credit and direct share link in the city. Removed the temporary contribution afterward; the project retains its eight starter places.
- Checked the local preview, saved unfinished draft, friendly username error, and focus moving to the invalid field.
- Corrected narrow-screen building labels, sticky dialog controls, night roof colors, preview/source duplication during development, and illustration bounds.
- Loaded a production build from `/forktown/` and opened a direct link to the observatory, confirming the GitHub Pages-style subpath works.

## Still requires the public repository

GitHub Actions and public Pages deployment are configured but have not run on GitHub. The owner must create/connect the remote repository, configure the Pages source and opt-in variable, and verify an actual fork-to-pull-request-to-published-city cycle. The current browser preview is local only.
