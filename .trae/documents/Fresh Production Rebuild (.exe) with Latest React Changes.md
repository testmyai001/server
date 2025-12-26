## Objectives
- Clean old release artifacts
- Build React app with latest changes
- Package a fresh Windows installer (.exe)
- Verify desktop output (win-unpacked + installer)

## Pre-Checks
- Close any running dev/packaged Electron instances
- Ensure Node 18+, npm installed

## Cleanup
- Delete old release folders: `release_v8`, `release_v9` (if present)
- Remove any locked `win-unpacked` directories that may block packaging

## Versioning
- Bump `package.json` version (e.g., 0.2.0) for a clean release tag

## Build Steps
- Build React assets: `npm run build`
- Package desktop app: `npm run electron:dist`
- Output directory: create `release_v10` for clean separation from previous builds

## Verification
- Run `release_v10/win-unpacked/AutoTallyAI.exe` to smoke test UI
- Confirm:
  - Bank Statement scroll matches Dashboard (no window-level scrollbar)
  - Updated headings (“Bank Statement”, “Invoice Processing”) appear
  - Connection badge reflects Tally status correctly
- Install via `release_v10/AutoTallyAI Setup <version>.exe` and re-check functionality

## Optional (Signing)
- If you provide a code-signing cert, sign the installer during build

## Deliverables
- `release_v10/AutoTallyAI Setup <version>.exe`
- `release_v10/win-unpacked/AutoTallyAI.exe`
- Effective config and blockmap files for release

## Rollback
- If any issues occur, revert to previous version and/or rebuild with `release_v9` settings