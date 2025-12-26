## Goal
- Ensure Electron desktop app reflects the same UI changes as the localhost web app.
- Align Bank Statement scroll with Dashboard and verify in Electron.

## Diagnose Current Run State
- Check whether the desktop app is the packaged installer or the dev Electron:
  - Dev Electron auto-opens DevTools; packaged installer does not.
  - Dev Electron loads `http://localhost:5173`; packaged loads `dist/index.html`.

## Dev Environment Refresh Steps
1. Close any running packaged `AutoTallyAI.exe` instances (avoid stale `release_v*`).
2. Stop existing dev Electron and Vite processes; restart:
   - `npm run electron:dev` (concurrently starts Vite and Electron).
3. In Electron, perform a hard reload to bypass cache:
   - Use DevTools → `Ctrl+Shift+R` on the renderer window.
4. Verify Bank Statement container classes in DevTools (Elements → Computed):
   - Outer: `overflow-y-auto scrollbar-hide h-full min-h-0`.
   - Table wrapper: `flex-1` (no `overflow-auto`).

## Production Rebuild (If You’re Using Installer)
1. Build web assets: `npm run build`.
2. Build Windows installer: `npm run electron:dist`.
3. Install and launch the new `release_v9/AutoTallyAI Setup 0.1.0.exe`.
4. Verify Bank Statement scroll and headings.

## Optional Improvements (if desync persists)
- Add a Reload shortcut/menu in Electron main:
  - Register `Ctrl+R` to call `mainWindow.reload()`.
- Add environment badge in Navbar showing `DEV` vs `PROD` to avoid confusion.

## Success Criteria
- Electron desktop shows no page-level scrollbar in Bank Statement, matching Dashboard.
- Headings display updated text (“Bank Statement”, “Invoice Processing”).
- Web and desktop render identically for the updated components.
