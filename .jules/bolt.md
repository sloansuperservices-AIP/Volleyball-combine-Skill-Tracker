## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-07-17 - Render Loop Filtering & Sorting in Position Categories
**Learning:** Performing multiple `.filter` and `.sort` operations (with nested `totalScore` computations) inside a render-loop map function for each position category in a long list causes significant lag and scaling bottlenecks during state changes.
**Action:** Group and pre-sort athletes into a memoized dictionary of arrays (`poolByCat`) outside of the render loop, reducing render-time overhead to a simple key lookup ($O(1)$) per category.
