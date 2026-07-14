#!/bin/bash
# Script to run the Volleyball News & Rules Agent
# This script should be scheduled to run daily at 12:00 PM

# Navigate to the repository root
# cd /path/to/repo

# Run the agent
python3 agent/news_expert.py >> agent_run.log 2>&1
