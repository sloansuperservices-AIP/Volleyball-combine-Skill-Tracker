## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-07-24 - Unmemoized dependent hooks causing render-loop cache invalidation
**Learning:** Having an unmemoized array like `ageAths` recreated on every render of a Preact/React component invalidates dependent `useMemo` hooks (such as `pool`), forcing expensive O(N log N) sort calculations to re-run on every minor state update. Additionally, filtering and sorting arrays (with O(N log N) sorting using expensive metric lookups) inside map loops in the component's render function is a severe bottleneck.
**Action:** Extract filtered arrays to a parent `useMemo` hook, declare it first to avoid initialization issues, and pre-group/sort categorization arrays into a memoized map (`poolByCat`) to turn high-overhead render-loop calculations into O(1) lookups.
