# Daily Update Scheduling

To ensure the Volley Agent pulls updated news, social media posts, and rule updates every day at noon, add the following entry to the crontab:

```cron
# Replace /path/to/repo with the actual absolute path to your repository
0 12 * * * cd /path/to/repo && /usr/bin/python3 volleyball_agent.py >> agent_log.txt 2>&1
```

This will run the agent at 12:00 PM every day and log the output to `agent_log.txt`.
