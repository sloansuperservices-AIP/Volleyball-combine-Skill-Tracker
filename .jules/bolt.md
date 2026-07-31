## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-03-02 - Redundant filtering and reference identity changes in Preact hooks
**Learning:** Using raw, unmemoized arrays (such as filtering lists inside render bodies) as dependencies for hooks like `useMemo` or `useEffect` triggers unnecessary recalculations and re-renders on every parent render. Additionally, sorting these lists in-place inside `useMemo` can mutate memoized states, leading to unpredictable side-effects.
**Action:** Wrap the common list-filtering expression in a memoized hook (e.g., `useMemo`) first, and ensure downstream hooks use shallow copies (e.g., `[...memoizedArray]`) when performing mutative operations like sorting.
