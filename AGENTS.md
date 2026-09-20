# Mid TN VBC — Tryout Manager Pipeline & Architecture

## Integrated Development Pipeline (The Tandem Pipeline)
This project is maintained through a collaborative "Tandem Pipeline" involving three primary entities working in synchronized collaboration:

1. **GitHub**: The source of truth for code, version control, and repository management.
2. **Google AI Studio**: Used for high-level strategic guidance, architectural planning, requirements analysis, and logic prototyping.
3. **Jules AI (Coding Agent)**: The primary implementation and refinement engine. Jules executes code changes, performs bug fixes, ensures repository health, and verifies all features within the sandbox environment.

**The Workflow**:
Strategic goals and user feedback are analyzed in Google AI Studio, then translated into actionable tasks for Jules. Jules implements changes directly in the sandbox, which are then reviewed and pushed to GitHub for versioned stability.

## Technical Architecture
- **Framework**: [Preact 10](https://preactjs.com/) with [htm](https://github.com/developit/htm) (no build step, loads via ESM modules from `esm.sh`).
- **Persistence**: Browser `localStorage` using the key `midtn_tryout_v2`.
- **Styling**: Scoped CSS within `tryouts/index.html` (Dark theme: Gold #f0a500 and Dark background #0d1017).
- **Integrations**:
  - **VOLLEY AI**: A context-aware chatbot integrated into both `index.html` and `tryouts/index.html`, utilizing `volley_kb.json`.
  - **Knowledge Agent**: `agent/news_expert.py` (Python) scrapes SRVA and USAV sites to update the local knowledge base.

## Core Features & Initial User Review Resolutions
- **Walkups with Testing**: Self-service QR form or desk "+ Add Walkup" immediately assigns tryout number and routes to Station 1 (Physical) & Station 2 (Agility) testing and Check-In.
- **Stations Streamlined**: Station 1 (Height, Reach, Vertical) & Station 2 (Shuttle Run) with integrated digital stopwatch. Drill scoring is integrated directly into Check-In and search results.
- **Depth Chart Sorting**: Ranks athletes within position columns by primary position match first (descending total score) then secondary position match (descending total score), with secondary positions clearly badged.
- **Team Builder & Depth Chart Integration**: Displays full depth chart inside Team Builder with position grouping and 'Show All' pool visibility, note icons (📝), restriction warnings (⚠️), and team '🔒 Finalize' lock button.
- **Athlete Page Notes & Call Log**: Dedicated auto-expanding tryout notes and phone call log textarea on every athlete profile card.
- **Offer Process & Vacancy Management**: Supports team offer management with individual offer/resend capabilities for replacements when a player declines; accepting locks profile.
- **Check-in Data Editing**: Contact info confirmation on check-in and inline table editing for contact or position corrections.
- **Professional Exports**: Multi-field CSV export and optimized print-to-PDF styles for teams and registration lists.

## Maintenance Instructions
- **Updating Rules/News**: Run `python3 agent/news_expert.py` to refresh `volley_kb.json`.
- **Adding Athletes**: Athletes can be added via the "Add Walkup" feature in either the Check-In or Head Coach views.
- **Data Resets**: Clear browser `localStorage` or use the browser console: `localStorage.removeItem('midtn_tryout_v2')`.
- **Single File implementation**: The application is intentionally kept in a single file (`tryouts/index.html`) to simplify deployment and ensure all logic is readily accessible to the AI agents.

## Best Practices for Agents
- **State Management**: Uses Preact hooks (`useState`, `useMemo`, `useCallback`) for efficient state handling.
- **Data Integrity**: All destructive actions (e.g., hiding athletes) require explicit confirmation or are easily reversible.
- **Verification**: Launch a local HTTP server (`python3 -m http.server`) and verify functionality across different login roles. Use Playwright for visual regression testing and interaction verification.
