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
- **Depth Chart**: Automated ranking of athletes by position category and performance score (Supports primary position ranking with secondary badges).
- **Exports**: Detailed CSV and Print (PDF) exports for registration lists and finalized teams, including all metrics and coaching notes.

## Resolved End-User Tryout Page Review Notes
1. **Walkups & Testing Flow**:
   - Supported via self-service QR code / URL parameter (`?mode=walkup`) and "+ Add Walkup" modal on Check-In and All Reg views.
   - Walkup athletes automatically receive a TO# (200+) and flow into Station 1 (Physical) and Station 2 (Agility).
2. **Stations Configuration**:
   - **Station 1**: Physical metrics (Height, Reach, Vertical).
   - **Station 2**: Agility timing (Shuttle Run).
   - **Station 3 (Drills)**: Drill scoring integrated into Check-in search and Athlete Modal (No standalone station needed).
   - **Station 4 (Serve)**: Removed from active stations.
3. **Depth Chart Sorting & Visibility**:
   - Ranks athletes per position category prioritizing Primary Position matches first (sorted by score descending), followed by Secondary/Alt Position matches (sorted by score descending).
   - Displays clear secondary position badges (`Alt: S`, `Pri: OH`) on player rows.
4. **Team Builder Enhancements**:
   - Depth Chart grouping and Score sorting available in the Team Builder pool.
   - "Show All" toggle enables viewing all athletes or only unassigned athletes.
   - Icon indicators: `⚠️` for team restrictions ("Won't Accept") and `📝` for coaching/call notes.
   - "Finalize Roster" lock button (`🔒`) locks completed team rosters.
5. **Athlete Profile Notes & Call Log**:
   - Dedicated multiline "Tryout Notes & Call Log" text area in `AthleteModal`.
6. **Individual Offer Process**:
   - `TeamOfferModal` and `EmailModal` enable sending and resending individual roster offer letters (prefilled with specific team assignment, e.g. "14 Black").
   - Resend capability for replacement players when an offer is declined.
   - Profile locking (`teamLocked: true`) automatically applied upon offer acceptance.
7. **Check-In Information Editing**:
   - Instant "Edit Profile 📋" modal access on Check-In search results, Staff Hub, and All Reg table row clicks.
8. **PDF & Excel (CSV) Exports**:
   - Full CSV export and print-to-PDF supported across All Reg, Depth Chart, Results, Team Builder, and All Teams views.

## Maintenance Instructions
- **Updating Rules/News**: Run `python3 agent/news_expert.py` to refresh `volley_kb.json`.
- **Adding Athletes**: Athletes can be added via the "Add Walkup" feature in either the Check-In or Head Coach views.
- **Data Resets**: Clear browser `localStorage` or use the browser console: `localStorage.removeItem('midtn_tryout_v2')`.
- **Single File implementation**: The application is intentionally kept in a single file (`tryouts/index.html`) to simplify deployment and ensure all logic is readily accessible to the AI agents.

## Best Practices for Agents
- **State Management**: Uses Preact hooks (`useState`, `useMemo`, `useCallback`) for efficient state handling.
- **Data Integrity**: All destructive actions (e.g., hiding athletes) require explicit confirmation or are easily reversible.
- **Verification**: Launch a local HTTP server (`python3 -m http.server`) and verify functionality across different login roles. Use Playwright for visual regression testing and interaction verification.
