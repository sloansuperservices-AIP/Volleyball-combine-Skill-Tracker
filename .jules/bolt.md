## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-07-25 - React Hook Reference Identity and Render-time Sorting
**Learning:** Recalculating lists (like `athletes.filter()`) directly in render blocks or inside dependent hooks invalidates their memoization on every render of the host component. Furthermore, performing expensive nested filter/sort operations inside the render block (e.g., inside layout mapping) bypasses React’s memoization hooks completely.
**Action:** Always memoize base filter operations (e.g., `ageAths`) so dependent hooks preserve reference identity, and extract layout-specific sorting/grouping (e.g., `poolByCat`) into dedicated selectors/hooks rather than executing them inside render blocks.
