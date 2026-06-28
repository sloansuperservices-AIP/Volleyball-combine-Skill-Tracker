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
