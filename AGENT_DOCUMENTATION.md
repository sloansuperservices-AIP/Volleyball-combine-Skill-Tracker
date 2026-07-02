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

## Docker / Container Registry
The agent is containerized for easy deployment. You can build and push the image to the GitHub Container Registry (ghcr.io).

### 1. Build the image
```bash
docker build -t ghcr.io/NAMESPACE/midtn-updates-agent:latest .
```
Replace `NAMESPACE` with your GitHub username or organization name.

### 2. Authenticate to GHCR
```bash
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin
```
*Note: Requires a Personal Access Token (PAT) with `write:packages` scope.*

### 3. Push the image
```bash
docker push ghcr.io/NAMESPACE/midtn-updates-agent:latest
```

## Dependencies
- `requests`
- `beautifulsoup4`

Install them locally using:
`pip install -r requirements.txt`
