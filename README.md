# Mid TN VBC — Volleyball Management & Tryout Tracker

A high-performance, single-file web application for volleyball club tryouts, athlete skill tracking, roster management, and AI-powered information retrieval.

## The Tandem Pipeline (Collaborative Workflow)

This repository is maintained and iterated through **The Tandem Pipeline**, a synchronized collaboration between three specialized environments:

1. **GitHub**: The authoritative source of truth for version control, code review, release branching, and repository history.
2. **Google AI Studio**: The architectural strategy, prompt design, and feature requirement analysis engine. Used to formulate detailed domain models, rule interpretations, and architectural blueprints.
3. **Jules AI (Coding & Verification Agent)**: The autonomous implementation engine operating within a sandboxed environment. Jules translates architectural strategies into clean code, executes rigorous syntax and end-to-end Playwright tests, enforces accessibility and micro-UX standards, and submits verified PRs.

### Strategic Pipeline Loop
```
[User Notes / Leadership Review]
       ↓
[Google AI Studio] → Architectural Strategy & Logic Design
       ↓
[Jules AI Agent]   → Code Implementation, Standalone Verification & Pre-Commit Checks
       ↓
[GitHub Repo]      → Source of Truth, PR Integration & Continuous Deployment
```

## Features
- **Tryout Manager (`tryouts/index.html`)**:
  - **Walk-up Registration**: Quick QR-code or desk-side walk-up check-in with automatic TO# assignment and testing station guidance.
  - **Station Testing**: Station 1 (Physical: Height, Reach, Vertical) and Station 2 (Agility: Shuttle Run with integrated stopwatch). Drill score input integrated into check-in and search.
  - **Depth Chart**: Real-time position ranking (Setters, Middles, Outside/RS, Defense) sorted by primary position with secondary visible, or optional multi-position mode.
  - **Team Builder**: Interactive roster builder with "Show All" pool visibility, depth chart/score sorting, team finalization lock mechanism, and special restriction (`⚠️`) / notes (`📝`) indicators.
  - **Individual Roster Offer Management**: Send and re-send personalized offer letters or performance reports with automatic profile locking upon player acceptance.
  - **Exports**: Full CSV export (spreadsheet format for Excel / Google Sheets) and printable PDF formatted cards (`@media print`).
- **VOLLEY AI Chatbot (`chatbot.js`)**: Context-aware assistant embedded on the main site and tryout portal, trained on official USA Volleyball rules, SRVA policies, and tryout timelines.

## Local Development & Testing
Run a local HTTP server from the repository root:
```bash
python3 -m http.server 8080
```
Then navigate to `http://localhost:8080/tryouts/` in your browser.

### Verify Syntax & E2E Tests
```bash
# Validate JavaScript syntax inside static HTML
python3 -c "import re; content=open('tryouts/index.html').read(); scripts=re.findall(r'<script>(.*?)</script>', content, re.DOTALL); open('temp.js','w').write(scripts[1]);" && node -c temp.js && rm temp.js

# Run Playwright E2E verification
python3 verify_tryouts.py
```

---
*Maintained by the Mid TN VBC Digital Team & The Tandem Pipeline*
