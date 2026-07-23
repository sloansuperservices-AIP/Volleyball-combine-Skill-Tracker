## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-07-23 - Unmemoized Render Filters Invalidating Dependent useMemo Hooks
**Learning:** Unmemoized array filter operations in a React/Preact render loop produce fresh reference identities on every render. When these references are passed as dependencies to heavy sort/computation `useMemo` hooks (e.g., `pool`), those hooks will execute on every single unrelated render (e.g. search query typing in another tab).
**Action:** Always memoize intermediate filters (like `ageAths`) with `useMemo` before utilizing them as dependencies in other hooks. Furthermore, clone the memoized array (e.g., `[...ageAths]`) prior to executing mutative operations like `.sort()` to prevent side-effects on the memoized state.
