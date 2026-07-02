# Volleyball Updates Agent Documentation

The `agent/news_expert.py` script is an automated expert system that scrapes news and updates from Mid TN Volleyball Club, USA Volleyball, and SRVA. It populates `volley_kb.json` which powers the Volley AI chatbot.

## Features
- **Club News Scraper**: Pulls headlines from midtnvbc.com.
- **USAV Scraper**: Pulls latest stories from usavolleyball.org.
- **SRVA Scraper**: Checks for registration updates on srva.org.
- **Social Media**: Updates social media placeholders for Instagram and Facebook.
- **Expert Rules**: Maintains a curated list of USAV and SRVA rule highlights.

## Scheduling
The agent is designed to run daily at 12:00 PM.

### Setup Instructions (Crontab)
To schedule the agent on a Linux/macOS server:

1. Open your crontab editor:
   ```bash
   crontab -e
   ```

2. Add the following line (adjusting the path to your repository):
   ```bash
   0 12 * * * /bin/bash /path/to/your/repo/run_agent.sh
   ```

3. Ensure the script is executable:
   ```bash
   chmod +x run_agent.sh
   ```

## Logs
Execution logs are written to `agent_run.log` in the repository root.
