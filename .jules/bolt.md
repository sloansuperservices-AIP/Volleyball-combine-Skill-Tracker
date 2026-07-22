## 2025-05-15 - Sorting O(N log N) overhead in Preact hooks
**Learning:** Calculating derived scores (like `totalScore`) within a sort comparator causes redundant execution, scaling poorly as list size grows.
**Action:** Use a "Schwartzian transform" pattern: pre-calculate and memoize values in a Map before sorting within `useMemo` hooks to ensure linear overhead for derivations.

## 2026-07-22 - Reference equality invalidation in React/Preact hooks
**Learning:** Instantiating derived array transformations (like `.filter()`) directly in the component body breaks the reference identity on every render. This completely invalidates any downstream `useMemo` hooks (such as sorting or categorization blocks) that depend on those array references, triggering redundant computations on unrelated state updates.
**Action:** Always wrap filter transformations in `useMemo` with minimal dependencies (e.g., `[athletes, age]`) and place them before any dependent memoization hooks to ensure clean reference identity and optimal rendering.
