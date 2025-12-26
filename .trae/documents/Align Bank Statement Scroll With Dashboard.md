## Goal

Match Bank Statement scrolling behavior to Dashboard: single page-level scroll with hidden scrollbar, no inner duplicate scroll.

## Current vs Desired

- Dashboard container: `overflow-y-auto scrollbar-hide` (src/components/Dashboard.tsx:88) — page scroll, scrollbar hidden.
- Bank Statement container: `overflow-y-hidden scrollbar-hide h-[calc(100vh-0px)]` — no page scroll; inner table scrolls.
- Desired: Bank Statement uses the same pattern as Dashboard.

## Changes

1. Outer container (src/components/BankStatementManager.tsx:343)
   - Replace class with: `flex flex-col h-full min-h-0 gap-6 overflow-y-auto scrollbar-hide animate-fade-in relative p-1 transition-all duration-200 ...`
   - Move `ref={pageScrollRef}` back to this outer container (it currently sits on the table wrapper).

2. Table wrapper (src/components/BankStatementManager.tsx:514)
   - Remove `overflow-auto scrollbar-hide` to avoid a second scroll area; leave `className="flex-1"` (and keep sticky header intact).
   - Remove `ref={pageScrollRef}` here since it belongs to the outer container.

3. Duplicate/Override audit
   - Scan Bank Statement component for any nested `overflow-y-auto` that may reintroduce inner scroll; ensure only the top container scrolls.

4. Headings (already updated)
   - Keep "Bank Statement" and previous Invoice wording changes.

## Verification

- Run `npm run electron:dev`, open Bank Statement view.
- Confirm: no inner scrollbars; only page-level scroll, scrollbar hidden like Dashboard.
- Sticky table header remains functional during page scroll.
- Web dev (`npm run dev`) matches desktop behavior.

## Safety

- Only class and ref adjustments; no logic changes.
- Easy rollback to previous overflow styles if needed.
