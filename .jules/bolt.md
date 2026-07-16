## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2025-05-16 - Falsy pitfalls in derived score caching
**Learning:** When caching numeric results (like `_score`), standard falsy checks (`if (sc)`) fail for valid `0` values, causing redundant re-calculations or incorrect "—" (null) displays.
**Action:** Always use explicit null/undefined checks (`sc !== null`) when working with derived numeric caches to preserve data integrity for edge-case scores.
