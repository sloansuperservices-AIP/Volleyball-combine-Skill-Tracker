## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2025-05-16 - Intermediate filter reference invalidation & inline JSX sorting
**Learning:** An unmemoized array filter in the component body (`ageAths`) creates a new array reference on every render, invalidating downstream `useMemo` dependencies (`pool`) and forcing heavy sorting/filtering in JSX loops to execute on every render frame.
**Action:** Always memoize intermediate filtered arrays (`ageAths`) before passing them to dependent hooks, and extract multi-category grouping and sorting out of JSX render loops into a `useMemo` hook (`poolByCat`).
