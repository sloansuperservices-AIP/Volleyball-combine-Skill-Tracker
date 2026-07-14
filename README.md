# Volleyball-combine-Skill-Tracker
Skill tracking for Volleyball using vision and leaderboard. 

## The Collaborative Tandem
This project is maintained through a high-efficiency pipeline:
- **GitHub**: Repository management and code hosting.
- **Google AI Studio**: Strategic planning and requirement analysis.
- **Jules AI**: Autonomous implementation, testing, and refinement.

## Expert News & Rules Agent
The project includes an automated agent (`agent/news_expert.py`) that maintains the `volley_kb.json` knowledge base. It is designed to pull news from the club website, USA Volleyball, and SRVA.

### Scheduling
To satisfy the requirement of daily updates at noon, you can use the built-in daemon mode or a system crontab:

**Option 1: Daemon Mode**
```bash
python3 agent/news_expert.py --daemon &
```

**Option 2: Crontab (Recommended)**
```bash
0 12 * * * cd /path/to/repo && bash run_agent.sh
```

---
*Maintained by the Mid TN VBC Digital Team*
