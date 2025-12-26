## Issue

* Vertical scrollbar appears in the desktop app on the Bank Statement view, while it is not visible on the web.

* Cause: The outer container uses `overflow-y-auto`, so Electron (Chromium) shows a system scrollbar. The inner table is already scrollable and has `scrollbar-hide`, so the outer scroll is redundant.

## Fix Strategy

1. Constrain scrolling to the transactions table only; remove page-level scroll in the Bank Statement view.
2. Hide the outer container scrollbar and ensure auto-scroll targets the inner table, page should also scroll just hide the bar 

## Code Changes

* In `src/components/BankStatementManager.tsx`:

  1. Top-level container (around line 341):

     * Replace `overflow-y-auto` with `overflow-y-hidden`.

     * Append `scrollbar-hide` to the class list to suppress any OS scrollbar styling.
  2. Transactions table wrapper (around line 514):

     * Add `ref={pageScrollRef}` to `<div className="flex-1 overflow-auto scrollbar-hide">` so programmatic scroll uses table wrapper.
  3. Auto-scroll effect (lines 44–48):

     * No logic change needed; it will now apply to the table wrapper via the moved `ref`.

## Verification Steps

* Desktop app: Open Bank Statement view.

  * Outer page should not show a vertical scrollbar.

  * The transactions table remains scrollable with hidden scrollbar visuals.

  * When transactions load, the table auto-scrolls to the bottom.

* Web app: Behavior remains consistent; no extra page scrollbar appears.

## Rollback Safety

* Changes are limited to class names and a `ref` on the table container.

* If needed, revert the class back to `overflow-y-auto` and remove the `ref` to restore previous behavior.

## Expected Outcome

* No visible outer scrollbar in Electron on the Bank Statement view.

* Smooth, contained scrolling inside the transactions table only.

