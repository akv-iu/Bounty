# Proposed UI direction

Status: visual direction accepted in conversation on October 27, 2026, with a region-by-hour heatmap added to the intended UI. The existing preview still shows the earlier plain timeline. This does not authorize application implementation. The product design remains in Design_Proposal.md.

## Visual reference

Inspected https://www.torus.co/ in the browser, including computed styles, during this review.

- Primary dark: #151515.
- Secondary dark observed on the site: #2E2E2E. Preview panels use a slightly darker derived #202220.
- White headings: #FFFFFF; site secondary text: #DBDBDB.
- Mint accent observed on site: #A4F8AC.
- Site typography: CircularXX Book, CircularXX Regular, CircularXX Mono.
- Preview substitutes: DM Sans and IBM Plex Mono. Exact CircularXX usage remains subject to having the appropriate font files and permission to use them.
- Rounded controls, restrained section boundaries, generous headings; dense information uses smaller, aligned text.
- Sunward is a provisional project name, not an official Torus product.

## Page and interactions

One desktop page, stacking vertically on small screens:

1. Product header and an explicit scenario classification.
2. Five-pool US map on the left; selected-hour carbon, simulated electricity price and spare GPU count beneath it. Region buttons provide a text equivalent to the map pins.
3. Workload controls on the right: priority, deadline, region eligibility and a capacity preset. Recommendation and reason sit immediately below those controls.
4. Five-region by 24-hour heatmap on a common UTC axis, outlining the selected job's full window. Selected-cell detail lists every overlapping job and total/free GPUs, avoiding hidden concurrent work. Toggle carbon intensity or simulated electricity price; display the scale and units. Cell selection updates the map's region/hour. Scrubbing inspects the scenario; it does not reschedule work. The measure toggle is separate from the scheduler's objective. Preserve readable cells on narrow screens with local horizontal scrolling and fixed region labels; equivalent region/hour selectors remain available.
5. Three strategy rows: earliest at home, wait at home, choose region and time. The geographic comparison references waiting at home.
6. Expandable data and assumptions section.

Edits recalculate the what-if plan and all comparison rows. A failed placement gives a concrete reason and no fabricated savings. If all policies place no jobs, display "No completed work to compare" and no savings. Lower carbon is allowed to cost more. No execution button implies a real cloud dispatch. Label invalid, unapplied drafts so the last valid result cannot be mistaken for the invalid request's result.

## Preview scope and validation

The preview contains one synthetic evaluation job with computed window selection. Carbon curves, seeded prices and capacity are all synthetic. Its numbers are not evidence of regional energy conditions or actual savings. The final batch scheduler and historical ingestion have not been implemented.

Verified in the browser: flexible and tighter deadlines, cost priority, home-only eligibility, and capacity rejection. Checked the desktop rendering and narrow-screen overflow; no browser console errors were reported. The fragment contains small runtime assertions for eligibility, capacity, scheduling bounds and the energy-unit conversion.

The source fragment is output/torus-ui-preview.html; output/preview.html is its standalone inspection wrapper. Map geometry is projected from US Atlas v3 / Census geometry. Marker locations are representative state centroids, not cloud sites or balancing-area boundaries.

## Accepted direction and remaining checks

Retain the dark Torus-inspired palette, free type substitutes and map-plus-workload layout. Keep the proposed final application's selectable batch of jobs and richer explanation in scope; the single-job preview is only for reviewing the interface. Heatmap contrast, assignment overlay readability and keyboard/narrow-screen interaction require implementation-time verification. AI job entry is optional and must not delay the manual planning flow.
