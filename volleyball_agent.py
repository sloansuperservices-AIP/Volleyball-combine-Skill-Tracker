import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime

KB_FILE = 'volley_kb.json'

def fetch_updates():
    """
    Simulates fetching updates from the club's website and social media.
    In a real-world scenario, this would use actual scraping logic or APIs.
    """
    updates = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "news": [
            {
                "title": "2025-2026 Tryout Dates Announced",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "summary": "Official tryouts will begin on September 27, 2025. Register online via our Tryout Manager at MIDVBC.com."
            }
        ],
        "social_updates": {
            "instagram": "Recent post: Good luck to our teams competing this weekend! #midtnvbc @Midtvbc",
            "facebook": "Recent post: Reminder to complete your SRVA membership before tryouts."
        },
        "usa_volleyball": "Update: 2025-2027 Rulebook published. Multiple contacts on 2nd hit allowed if no advantage."
    }
    return updates

def update_kb(new_data):
    try:
        with open(KB_FILE, 'r') as f:
            kb = json.load(f)
    except FileNotFoundError:
        kb = {}

    # Update news if not already present
    if "news" not in kb:
        kb["news"] = []

    for item in new_data["news"]:
        if item["title"] not in [n["title"] for n in kb["news"]]:
            kb["news"].insert(0, item)

    # Limit news items
    kb["news"] = kb["news"][:10]

    # Update social and external info
    kb["social_updates"] = new_data["social_updates"]
    kb["usa_volleyball_latest"] = new_data["usa_volleyball"]
    kb["last_agent_run"] = new_data["last_updated"]

    with open(KB_FILE, 'w') as f:
        json.dump(kb, f, indent=2)

    print(f"Knowledge Base updated successfully at {new_data['last_updated']}")

if __name__ == "__main__":
    data = fetch_updates()
    update_kb(data)
