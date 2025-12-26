## Why Desktop Shows Scrollbar
- Window-level (html/body) scrolling makes Electron render a native scrollbar even when component scrollbars are hidden.
- Browser hides it because the page scroll is contained at the view level (Dashboard pattern).
- Evidence of stale desktop code: heading differs (“Bank Statement Processing” vs “Bank Statement”), which indicates an old packaged build running.

## Confirm Runtime & Sync Renderer
1. Close any packaged `AutoTallyAI.exe` instances.
2. Start dev Electron with live renderer: `npm run electron:dev`.
3. Force a hard reload inside Electron (`Ctrl+Shift+R`) to reapply CSS.
4. Verify headings and classes:
   - Bank heading shows “Bank Statement”.
   - Outer container: `overflow-y-auto scrollbar-hide h-full min-h-0`.
   - Table wrapper: `flex-1` (no inner overflow).

## Global CSS Enforcement (Already Planned)
- Ensure `src/index.css` includes:
  - `html, body { height: 100%; overflow: hidden; }`
  - `#root { height: 100%; }`
- This prevents window-level scrollbars everywhere so Electron cannot draw the side bar.

## Fallback (if CSS ever fails)
- Inject CSS via Electron after load:
  - `mainWindow.webContents.insertCSS('html,body{overflow:hidden;height:100%} #root{height:100%}')`.
- Optional DEV/PROD badge in Navbar to avoid confusion about which renderer is running.

## Rebuild Production
1. `npm run build`
2. `npm run electron:dist`
3. Install from `release_v9/AutoTallyAI Setup 0.1.0.exe` and verify the scrollbar is gone.

## Success Criteria
- No window-level scrollbar visible in Electron.
- Dashboard & Bank Statement behave identically (single page-level scroll, scrollbar hidden; table scroll within page).
- Headings match updated text across views.