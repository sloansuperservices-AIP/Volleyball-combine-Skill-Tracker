# Mid TN VBC Tryout Management Application - Technical Architecture & Pipeline

## Overview
This application is a specialized tool for managing volleyball tryouts, including check-in, physical testing (metrics), depth charting, and team building. It is designed to be fast, portable, and offline-capable (via `localStorage`).

## Technical Stack
- **Frontend:** Preact 10 (via ESM modules from `esm.sh`).
- **Templating:** `htm` (Hyperscript Tagged Markup) for JSX-like syntax without a build step.
- **Styling:** CSS-in-JS (embedded in `index.html`).
- **Data Persistence:** `localStorage` (key: `midtn_tryout_v2`).
- **Icons:** Standard Unicode/Emoji for minimal external dependencies.

## Key Features
- **Role-Based Access:**
  - Head Coach (`0000`): Full access to all views.
  - Check-In (`9999`): Search and mark athletes as arrived.
  - Station 1 (`1111`): Physical metrics (Height, Reach, Vertical).
  - Station 2 (`2222`): Agility metric (Shuttle Run).
- **Team Builder:** Drag-and-drop roster management with a 'Finalize' lock mechanism.
- **Depth Chart:** Automated ranking of athletes by position and score.
- **CSV Export:** Comprehensive data export for teams and registration lists.

## Collaborative Pipeline
This project is maintained through a collaborative pipeline involving:
1. **GitHub:** Source control and hosting via GitHub Pages.
2. **Google AI Studio:** Environment for high-level reasoning and architectural planning.
3. **Jules (AI Coding Agent):** Implementation, bug fixing, and technical refinement.

### Best Practices for Agents
- **Single File:** The application is intentionally kept in a single file (`tryouts/index.html`) to simplify deployment and ensure all logic is readily accessible to the AI agent.
- **State Management:** Uses Preact hooks (`useState`, `useMemo`, `useCallback`) for efficient state handling.
- **Data Integrity:** All destructive actions (e.g., hiding athletes) require explicit confirmation or are easily reversible.

## Maintenance
- **Data Resets:** To clear all data, clear `localStorage` or use the browser console: `localStorage.removeItem('midtn_tryout_v2')`.
- **Updates:** When updating `RAW` data at the top of the script, ensure the `to` (Tryout Number) remains unique.
