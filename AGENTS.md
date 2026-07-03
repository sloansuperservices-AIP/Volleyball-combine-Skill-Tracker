# Mid TN VBC — Tryout Manager Pipeline & Architecture

## Technical Architecture
- **Framework**: [Preact 10](https://preactjs.com/) with [htm](https://github.com/developit/htm) (no build step, loads via ESM).
- **Persistence**: Browser `localStorage` using the key `midtn_tryout_v2`.
- **Styling**: Scoped CSS within `index.html`.
- **Integrations**:
  - **VOLLEY AI**: A context-aware chatbot integrated into both `home.html` and `index.html`, utilizing `data/knowledge_base.json`.
  - **Knowledge Agent**: `agent/news_expert.py` (Python) scrapes SRVA and USAV sites to update the local knowledge base.

## Development Pipeline (The Tandem)
This project is maintained through a collaborative loop between three primary entities working in tandem:
1. **GitHub**: The source of truth for code, version control, and repository management.
2. **Google AI Studio**: Used for high-level strategic guidance, architectural planning, requirements analysis, and logic prototyping.
3. **Jules AI (Coding Agent)**: The primary implementation and refinement engine. Jules executes code changes, performs bug fixes, ensures repository health, and verifies all features within the sandbox environment.

## Core Features
- **Role-Based Access**:
  - `0000`: Head Coach (Full access: Team Builder, Depth Chart, Results, All Reg, Hidden).
  - `9999`: Check-In (Check-in athletes, add walk-ups).
  - `1111`: Station 1 (Physical: Height, Reach, Vertical).
  - `2222`: Station 2 (Agility: Shuttle Run).
- **Team Builder**: Drag-and-drop roster management with a persistent "Accepted" lock.
- **Exports**: Detailed CSV exports for both registration lists and finalized teams, including all physical metrics and coaching notes.

## Maintenance Instructions
- **Updating Rules/News**: Run `python3 agent/news_expert.py` to refresh `data/knowledge_base.json`.
- **Adding Athletes**: Athletes can be added via the "Add Walkup" feature in either the Check-In or Head Coach views.
- **Data Resets**: Clear browser `localStorage` or use the "Log Out" feature to switch roles.
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
