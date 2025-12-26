## Goal

Apply the same inner-upload-box hover effect used in the Excel uploader to the Bank Statement uploader, ensuring the box fades to white on hover with theme-appropriate border changes and no page-wide hover effects.

## Current State

* Bank Statement inner box already includes fade-on-hover: `hover:bg-white`, `dark:hover:bg-slate-800`, and hover border tweaks; drag-over tint/ring is on the root container.

* Excel inner box uses identical pattern with emerald theme; drag-over tint/ring is also on the root container.

## Changes (If Missing in Your Local View)

* In `src/components/BankStatementManager.tsx`, update the inner upload box (step === 1) classes to match Excel’s hover behavior:

  * Add: `hover:bg-white dark:hover:bg-slate-800`

  * Add: `hover:border-indigo-300 dark:hover:border-indigo-500`

  * Keep drag-over classes applied only when `isDragOver` is true.

* Do not add hover effects to the root container; keep visual feedback limited to the inner upload box.

## Exact Code Locations

* Bank Statement inner box: `src/components/BankStatementManager.tsx:406-413` controls the conditional classes for hover/drag.

* Excel inner box reference: `src/components/ExcelImportManager.tsx:382-388` shows the emerald-themed hover/drag classes.

## Verification

* Hover over the inner upload box: background fades to white, border lightens; icon scales via `group-hover:scale-110`.

* Drag a file anywhere over the component: only the inner box shows tint/ring; no page-wide effect.

* Click on header or buttons: no double-open due to `e.stopPropagation()`.

## Outcome

* Bank Statement uploader has the same hover experience as Excel (indigo theme), consistent across all three uploaders without affecting the whole page.

