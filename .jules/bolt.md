## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-07-20 - Memoization of state-filtered list (ageAths) and caching performance scores
**Learning:** Instantiating filtered arrays (like `athletes.filter`) inside a component render block triggers downstream `useMemo` hooks on every single render due to new array references.
**Action:** Wrap any filtered list representation inside `useMemo` to preserve reference identity, and construct a memoized score Map to avoid O(N log N) overhead on unrelated renders.
