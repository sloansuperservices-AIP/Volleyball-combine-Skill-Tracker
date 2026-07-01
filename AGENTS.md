# Tryout Manager Development Pipeline

This document outlines the integrated development pipeline and architectural details for the Mid TN VBC Tryout Manager.

## Integrated Pipeline

The project is maintained through a collaborative effort involving:

1.  **GitHub**: Serves as the primary source of truth for the codebase, handling version control and repository management.
2.  **Google AI Studio**: Provides high-level strategic guidance, requirements analysis, and design patterns for complex features.
3.  **Jules AI**: The primary coding agent responsible for implementation, bug fixes, and feature refinement within the sandbox environment.

## Technical Architecture

-   **Frontend**: Single-file Preact (10.x) application.
-   **Module Management**: Uses `esm.sh` for importing Preact and `htm` directly in the browser, eliminating the need for a complex build step.
-   **Persistence**: Data is persisted using the browser's `localStorage` (key: `midtn_tryout_v2`).
-   **Styling**: Modern CSS with a dark theme, utilizing Flexbox and CSS Grid for responsive layouts.

## Key Features

-   **Check-In Station**: Quick search and arrival marking for registered athletes and day-of walkups.
-   **Tryout Stations**: Dedicated views for physical (Height, Reach, Vertical) and agility (Shuttle Run) testing.
-   **Depth Chart**: Automated ranking of athletes by position category and performance score.
-   **Team Builder**: Drag-and-drop interface for roster management with real-time status tracking and finalized team locking.

## Verification Procedures

-   **Manual Testing**: Launching a local HTTP server (`python3 -m http.server`) and verifying functionality across different login roles.
-   **Automated Verification**: Using Playwright for visual regression testing and interaction verification.

---
*Last Updated: 2026-2027 Season*
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
