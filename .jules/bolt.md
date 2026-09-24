## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-09-24 - Preact render loop sorting anti-pattern
**Learning:** Filtering and sorting lists inside JSX render loops causes redundant execution on every re-render (e.g., when hovering or updating UI state).
**Action:** Move category grouping and sorting into dedicated `useMemo` hooks (like `poolByCat`) to execute filtering and sorting only when underlying data or sort preferences change.
