## Goals

* Remove the visible sidebar scrollbar in the Bank Statement view to match Dashboard behavior.

* Simplify headings: change "Bank Statement Processing" → "Bank Statement" and "Invoice AI Processing" → "Invoice Processing".

## Findings

* Dashboard hides scrollbars via `overflow-y-auto scrollbar-hide` on its top container (src/components/Dashboard.tsx:88).

* Bank Statement view currently uses `overflow-y-hidden scrollbar-hide` on the page container and `overflow-auto scrollbar-hide` on the table wrapper (src/components/BankStatementManager.tsx:343, :514).

  <br />

## Plan

1. Scrollbar behavior alignment

   * Add an explicit viewport height to the Bank Statement page container: `h-[calc(100vh- var(--nav-offset,0px))]` to prevent body-level overflow.

   * Keep outer container `overflow-y-hidden scrollbar-hide`; ensure only the table wrapper scrolls.

   * Confirm no duplicate wrappers set `overflow-y-auto` that would reintroduce a page scrollbar.

2. Heading updates

   * Bank Statement: change heading text to `Bank Statement` (remove "Processing").

   * Invoice Upload: replace `AI Processing Pipeline` with `Processing Pipeline`, and `Invoice AI Processing` with `Invoice Processing`.

3. Verification

   * Run desktop dev: `npm run electron:dev` and inspect Electron DevTools computed styles for the Bank Statement container.

   * Confirm no vertical scrollbar appears at window level; inner table remains scrollable with hidden scrollbar.

   * Check Dashboard and Invoice views for consistent headings.

## Safety

* Changes are limited to class name adjustments and text; no logic or API modifications.

* Easy rollback by restoring previous class names and heading strings.

