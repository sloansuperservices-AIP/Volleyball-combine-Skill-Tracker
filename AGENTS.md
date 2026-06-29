# Mid TN VBC — Tryout Manager Pipeline & Architecture

## Technical Architecture
- **Framework**: [Preact 10](https://preactjs.com/) with [htm](https://github.com/developit/htm) (no build step, loads via ESM).
- **Persistence**: Browser `localStorage` using the key `midtn_tryout_v2`.
- **Styling**: Scoped CSS within `index.html`.
- **Integrations**:
  - **VOLLEY AI**: A context-aware chatbot integrated into both `home.html` and `index.html`, utilizing `data/knowledge_base.json`.
  - **Knowledge Agent**: `agent/news_expert.py` (Python) scrapes SRVA and USAV sites to update the local knowledge base.

## Development Pipeline (The Tandem)
This project is maintained through a collaborative loop between three primary entities:
1. **GitHub**: The source of truth for code and version control.
2. **Google AI Studio**: Used for high-level architectural planning, logic prototyping, and complex problem-solving.
3. **Jules AI (Coding Agent)**: The primary implementation engine that executes code changes, runs tests, and ensures repository health.

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
