# Mid TN Volleyball Club Updates Agent

## Overview
The `updates_agent.py` script is designed to run daily at noon to fetch the latest news from:
- Mid TN Volleyball Club official website
- USA Volleyball news
- Club social media (Instagram & Facebook placeholders)

It updates `knowledge_base.json`, which serves as the primary data source for the Volley AI chatbot and the home page news section.

## Scheduling (Cron)
To run the agent every day at noon, add the following line to your crontab (`crontab -e`):

```bash
0 12 * * * /usr/bin/python3 /path/to/your/project/updates_agent.py >> /path/to/your/project/agent_log.txt 2>&1
```

## Dependencies
- `requests`
- `beautifulsoup4`

Install them using:
`pip install requests beautifulsoup4`
