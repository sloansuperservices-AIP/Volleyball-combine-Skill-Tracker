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

## Core Features & Access
- **Role-Based Access**:
  - `0000`: Head Coach (Full access: Team Builder, Depth Chart, Results, All Reg, Hidden).
  - `9999`: Check-In (Check-in athletes, add walk-ups).
  - `1111`: Station 1 (Physical: Height, Reach, Vertical).
  - `2222`: Station 2 (Agility: Shuttle Run).
- **Team Builder**: Drag-and-drop roster management with a 'Finalize' lock mechanism and 'Show All' pool visibility.
- **Depth Chart**: Automated ranking of athletes by position category and performance score (Supports multi-position ranking).
- **Exports**: Detailed CSV and Print (PDF) exports for registration lists and finalized teams, including all metrics and coaching notes.

## Maintenance Instructions
- **Updating Rules/News**: Run `python3 agent/news_expert.py` to refresh `volley_kb.json`.
- **Adding Athletes**: Athletes can be added via the "Add Walkup" feature in either the Check-In or Head Coach views.
- **Data Resets**: Clear browser `localStorage` or use the browser console: `localStorage.removeItem('midtn_tryout_v2')`.
- **Single File implementation**: The application is intentionally kept in a single file (`tryouts/index.html`) to simplify deployment and ensure all logic is readily accessible to the AI agents.

## Best Practices for Agents
- **State Management**: Uses Preact hooks (`useState`, `useMemo`, `useCallback`) for efficient state handling.
- **Data Integrity**: All destructive actions (e.g., hiding athletes) require explicit confirmation or are easily reversible.
- **Verification**: Launch a local HTTP server (`python3 -m http.server`) and verify functionality across different login roles. Use Playwright for visual regression testing and interaction verification.
