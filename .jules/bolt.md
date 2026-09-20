## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2025-05-20 - Render Loop Sorting in Grouped Category Lists
**Learning:** Performing category filtering (`pool.filter(...)`) and sorting inside JSX `.map(cat => ...)` blocks executes $O(N \log N)$ sorting and repeated filtering on every component re-render (e.g. during drag-and-drop or state updates).
**Action:** Move category-level grouping and pre-sorting into dedicated `useMemo` hooks (like `poolByCat`) that compute pre-sorted maps once per data change, reducing render phase complexity to $O(1)$ lookups.
