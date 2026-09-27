# Mid TN VBC — Tryout Manager & Volleyball Skill Tracker

An integrated volleyball tryout management system, skill tracker, and AI assistant for Mid TN Volleyball Club.

## The Collaborative Tandem Pipeline
This repository is developed and maintained using **The Tandem Pipeline**, a collaborative workflow across three core systems:

1. **GitHub**: Source of truth for version control, code hosting, branch management, and release tracking.
2. **Google AI Studio**: Strategic AI environment used for high-level architectural planning, complex requirements analysis, and system logic design.
3. **Jules AI (Coding Agent)**: Sandbox execution engine that performs automated implementation, code verification, bug fixes, micro-UX alignment, and pre-commit checks.

## Key Features & User Workflow

### 1. Registration & Walk-ups
- **Walk-Up Registration (`?mode=walkup`)**: Allows walk-up athletes to register on their phones by scanning a QR code at the check-in desk.
- **Immediate Assignment**: Newly registered walk-up players receive a unique TO# and automatically appear across all station check-ins and coach dashboards.
- **Check-In Verification**: Staff can review and update contact details (phone, email) directly at check-in before confirming attendance.

### 2. Testing Stations
- **Station 1 (Physical)**: Captures Height, Reach, and Vertical measurements.
- **Station 2 (Agility)**: Built-in stopwatch and shuttle run time recorder.
- **Check-In & Drill Scoring**: Drill scores can be entered directly on the check-in page, player modal, or results table.

### 3. Depth Chart & Team Builder
- **Depth Chart Toggles**: Switch between **Primary Pos Only** (groups athletes strictly by primary position with secondary position badges) and **Multi-Position** view.
- **Team Builder Pool**: Displays all registered athletes with multi-sorting (Total Score, Depth Chart, Name), expandable wide pool option, and immediate visual badges for Tryout Notes (📝) and Won't Accept Team Restrictions (⚠️).
- **Roster Lock & Finalization**: Lock finalized teams with a single click (`🔒 Finalize`), locking athlete profiles and highlighting team cards in gold.

### 4. Offers & Communication
- **Team & Individual Offers**: Send roster offers to whole teams or individual replacement players if an athlete declines.
- **Offer Status & Resending**: Resend offer letters anytime from the Team Offer Manager.
- **Automatic Locking**: When an athlete accepts an offer, their profile is automatically locked.

### 5. Exports & Reports
- **Excel/CSV Export**: Complete data export with 21 schema fields including all metrics, drill scores, notes, and contact details.
- **PDF Print Layouts**: Clean `@media print` styling for printing team rosters and registration lists.

## Local Setup & Development
```bash
# Serve locally
python3 -m http.server 8080

# Validate syntax
python3 /home/jules/self_created_tools/validator.py tryouts/index.html chatbot.js index.html volley_kb.json data/knowledge_base.json
```

---
*Maintained by Mid TN VBC Digital Team*
