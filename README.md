# Volleyball-combine-Skill-Tracker
Skill tracking for Volleyball using vision and leaderboard. 

## The Collaborative Tandem Pipeline

This project is maintained through a synchronized, multi-agent development pipeline designed for rapid iteration, continuous delivery, and full architectural oversight:

1. **GitHub**: The authoritative source of truth for version control, code review, branch protection, and production deployment.
2. **Google AI Studio**: High-level strategic partner used for system architecture design, complex prompt engineering, data schema modeling, and logic prototyping.
3. **Jules AI (Coding Agent)**: Autonomous implementation engine operating in sandbox environments to execute code modifications, bug fixes, automated Playwright UI testing, performance optimization, and repository maintenance.

## Mid TN VBC Tryout Manager Architecture & Features

- **Single-File Framework**: Built with Preact 10 + HTM via ESM modules for lightweight, zero-build deployment (`tryouts/index.html`).
- **Role-Based Access**:
  - `0000`: Head Coach (Full access: Team Builder, Depth Chart, Results, All Reg, Admin, Hidden).
  - `9999`: Check-In / Sign In Desk (Check in athletes, record contact info, add day-of walkups).
  - `1111`: Station 1 (Physical Metrics: Height, Reach, Vertical).
  - `2222`: Station 2 (Agility Shuttle Run with built-in Stopwatch timer).
- **Tryout Features**:
  - **Walk-Up Registration**: On-demand self-serve registration (`?mode=walkup`) with QR code sign generation and immediate Station 1 routing.
  - **Depth Chart**: Grouping by position categories (OH, MH, S, RS, DS, L), ranking by score, and clear secondary position badges (`Alt:` / `Pri:`).
  - **Team Builder**: Drag-and-drop roster building, position/score pool sorting, "Show All" pool visibility, note `📝` and restriction `⚠️` icons, and `🔒 Finalize` team locking.
  - **Offer Management**: Individual offer email sending/resending, status tracking (pending, offered, accepted, declined), and roster spot locking.
  - **Exports**: Excel-compatible 21-field CSV export and media-query optimized PDF Print export.

---
*Maintained by the Mid TN VBC Digital Team*
