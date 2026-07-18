## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2025-07-18 - Invalidated memoization due to un-memoized dependency references
**Learning:** Passing an un-memoized array reference (like a dynamically filtered list) as a dependency to other `useMemo` hooks causes the dependents to recalculate on every single render, completely invalidating the memoization.
**Action:** Centralize and memoize filtered lists (like `ageAths`) at the top of the component so that both the list reference and any derived computations/sorts (like `depthPool`, `resList`, and `pool`) are cached correctly.
