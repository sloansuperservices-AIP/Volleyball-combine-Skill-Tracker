## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2025-10-01 - Reference Identity Invalidation in Cascading useMemo Hooks
**Learning:** Unmemoized array filtering in component scope (e.g. `athletes.filter(...)`) creates a new array reference on every render, causing dependent `useMemo` hooks to re-execute needlessly.
**Action:** Wrap shared array filtering in a `useMemo` hook so downstream hooks only re-evaluate when underlying source state changes.
