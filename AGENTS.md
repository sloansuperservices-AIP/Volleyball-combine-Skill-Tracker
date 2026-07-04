# Mid TN VBC — Tryout Manager Pipeline & Architecture

## Technical Architecture
- **Framework**: [Preact 10](https://preactjs.com/) with [htm](https://github.com/developit/htm) (no build step, loads via ESM).
- **Persistence**: Browser `localStorage` using the key `midtn_tryout_v2`.
- **Styling**: Scoped CSS within `tryouts/index.html`.
- **Integrations**:
  - **VOLLEY AI**: A context-aware chatbot integrated into both `index.html` and `tryouts/index.html`, utilizing `volley_kb.json`.
  - **Knowledge Agent**: `agent/news_expert.py` (Python) scrapes SRVA and USAV sites to update the local knowledge base.

## Integrated Development Pipeline (The Tandem)
This project is maintained through a collaborative loop between three primary entities working in tandem:
1. **GitHub**: The source of truth for code, version control, and repository management.
2. **Google AI Studio**: Used for high-level strategic guidance, architectural planning, requirements analysis, and logic prototyping.
3. **Jules AI (Coding Agent)**: The primary implementation and refinement engine. Jules executes code changes, performs bug fixes, ensures repository health, and verifies all features within the sandbox environment.

## Core Features & Access
- **Role-Based Access**:
  - `0000`: Head Coach (Full access: Team Builder, Depth Chart, Results, All Reg, Hidden).
  - `9999`: Check-In (Check-in athletes, add walk-ups).
  - `1111`: Station 1 (Physical: Height, Reach, Vertical).
  - `2222`: Station 2 (Agility: Shuttle Run).
- **Team Builder**: Drag-and-drop roster management with a persistent "Accepted" lock and "Finalize" button.
- **Depth Chart**: Automated ranking of athletes by position category and performance score (Primary position sorted, secondary visible).
- **Exports**: Detailed CSV exports for registration lists and finalized teams, including all metrics and coaching notes.

## Maintenance Instructions
- **Updating Rules/News**: Run `python3 agent/news_expert.py` to refresh `volley_kb.json`.
- **Adding Athletes**: Athletes can be added via the "Add Walkup" feature in either the Check-In or Head Coach views.
- **Data Resets**: Clear browser `localStorage` or use the "Log Out" feature to switch roles.
