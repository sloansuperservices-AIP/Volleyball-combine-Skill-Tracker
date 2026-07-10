# Daily Update Scheduling

To ensure the Volley Agent pulls updated news, social media posts, and rule updates every day at noon, you have two options:

### 1. Crontab (Recommended for Servers)
Add the following entry to your crontab:

```cron
# Replace /path/to/repo with the actual absolute path to your repository
0 12 * * * cd /path/to/repo && /usr/bin/python3 agent/news_expert.py >> agent_run.log 2>&1
```

### 2. Built-in Daemon Mode
Run the script with the `--daemon` flag. It will calculate the time until the next 12:00 PM and sleep automatically.

```bash
python3 agent/news_expert.py --daemon &
```

This will run the agent at 12:00 PM every day and update `volley_kb.json` which fuels the Volley AI chatbot.
