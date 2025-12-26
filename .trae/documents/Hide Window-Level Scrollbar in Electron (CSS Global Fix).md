## Problem
- Browser hides page scrollbar; Electron shows a window-level scrollbar on Bank Statement.
- Component-level `scrollbar-hide` cannot affect the window (html/body) scrollbars.

## Root Cause
- `html`/`body` are allowed to scroll, so Electron renders a native scrollbar even if inner containers hide theirs.

## Fix Plan
1. Global CSS (preferred):
   - In `src/index.css` add under `@layer base`:
     - `html, body { height: 100%; overflow: hidden; }`
     - `#root { height: 100%; }`
   - This disables window-level scrolling and delegates scrolling to view containers.

2. Ensure view containers provide scrolling:
   - Dashboard already: `overflow-y-auto scrollbar-hide`.
   - Bank Statement outer container: `overflow-y-auto scrollbar-hide h-full min-h-0` (already applied).
   - Table wrapper remains `flex-1` (no inner overflow).

3. Optional Electron fallback (if CSS is ever bypassed):
   - Inject CSS on load:
     - In `electron/main.js` after load, add `mainWindow.webContents.insertCSS('html,body{overflow:hidden;height:100%} #root{height:100%}');`
   - Only used if global CSS fails; default to app CSS.

4. Verification
   - Dev web: `npm run dev` and confirm no page scrollbar; inner view scroll works.
   - Dev desktop: `npm run electron:dev` → hard reload (`Ctrl+Shift+R`) → confirm no window scrollbar; inner view scroll works.
   - Packaged: `npm run electron:dist` → install and verify.

## Safety
- Changes are limited to CSS; no logic or APIs affected.
- Easy rollback by removing the global `overflow: hidden` if required.

## Expected Outcome
- Electron window-level scrollbar hidden; Dashboard and Bank Statement behave identically with page-level scroll confined to the view container.