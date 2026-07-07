import json
import datetime
import os
import requests
import time
import argparse
import sys
from bs4 import BeautifulSoup

# Configuration
CLUB_WEBSITE = "https://www.midtnvbc.com"
USAV_NEWS_URL = "https://usavolleyball.org/stories/"
SRVA_WEBSITE = "https://www.srva.org/"
KB_FILE = "volley_kb.json"

def pull_club_news():
    """Pulls news from the club website."""
    print("Fetching Mid TN VBC news...")
    news = []
    try:
        response = requests.get(CLUB_WEBSITE, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # SportsEngine news selectors
            articles = soup.select('.newsSlideShow-item, .article, h3.headline')
            for article in articles[:5]:
                title = article.get_text(strip=True)
                link = article.find('a')['href'] if article.find('a') else CLUB_WEBSITE
                if not link.startswith('http'):
                    link = CLUB_WEBSITE + link
                if len(title) > 5:
                    news.append({"source": "Website", "title": title, "link": link})
    except Exception as e:
        print(f"Error pulling club news: {e}")
    return news

def pull_usav_updates():
    """Pulls important updates from USA Volleyball."""
    print("Fetching USA Volleyball stories...")
    updates = []
    try:
        response = requests.get(USAV_NEWS_URL, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            items = soup.select('article h2 a, .entry-title a, h3.post-title a')
            for item in items[:5]:
                title = item.get_text(strip=True)
                link = item.get('href')
                updates.append({"source": "USA Volleyball", "title": title, "link": link})
    except Exception as e:
        print(f"Error pulling USAV updates: {e}")
    return updates

def pull_srva_updates():
    """Pulls important updates from SRVA."""
    print("Fetching SRVA updates...")
    updates = []
    try:
        response = requests.get(SRVA_WEBSITE, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Look for recent news or alerts
            text_content = soup.get_text()
            if "Registration" in text_content:
                updates.append({"source": "SRVA", "title": "SRVA Registration Information", "link": SRVA_WEBSITE})
    except Exception as e:
        print(f"Error pulling SRVA updates: {e}")
    return updates

def get_social_placeholders():
    """Placeholders for Instagram/Facebook integration."""
    return {
        "instagram": "Latest from @midtnvbc: 'Our 2026-27 season prep is in full swing at Hooptown! #MidTNVBC'",
        "facebook": "Recent Post: 'Join us for our upcoming parent info session about tryout requirements and club programs.'"
    }

def update_knowledge_base():
    # Load existing KB to preserve structured data if any
    if os.path.exists(KB_FILE):
        with open(KB_FILE, 'r') as f:
            kb = json.load(f)
    else:
        kb = {
            "club_info": {
                "name": "Mid TN Volleyball Club",
                "location": "Smyrna, TN",
                "facility": "Hooptown",
                "website": "http://midtnvbc.com"
            },
            "news": [],
            "rules_and_regulations": {},
            "faq": []
        }

    # Pull real updates
    club_news = pull_club_news()
    usav_news = pull_usav_updates()
    srva_news = pull_srva_updates()
    social = get_social_placeholders()

    # Update News
    all_new_news = []
    today = datetime.date.today().isoformat()

    for item in club_news + usav_news + srva_news:
        all_new_news.append({
            "title": item['title'],
            "date": today,
            "summary": f"Source: {item['source']}. Link: {item['link']}"
        })

    # Combine with existing news, avoid duplicates by title
    existing_titles = [n['title'] for n in kb.get('news', [])]
    for n in all_new_news:
        if n['title'] not in existing_titles:
            kb.setdefault('news', []).insert(0, n)

    # Keep only latest 15
    kb['news'] = kb['news'][:15]

    # Update Social
    kb['social_updates'] = social

    # Update Expert Rules (Researched)
    kb['rules_and_regulations'] = {
        "usa_volleyball": {
            "expert_note": "2025-2027 Rule Highlights: Jewelry allowed if small/snug; re-serve allowed for tossing error (once per turn); Libero can be team captain; Coaches can stand/walk in free zone to attack line extension.",
            "link": "https://usavolleyball.org/resources-for-officials/rulebooks-and-interpretations/"
        },
        "srva": {
            "expert_note": "SRVA Policies: All participants must have valid USAV membership before tryouts. Offers accepted in SportsEngine are binding for the season. Max tryout fee $75. Registration usually opens in September.",
            "link": "https://www.srva.org"
        }
    }

    # Update FAQs
    kb['faq'] = [
        {
            "question": "Where do I sign in for tryouts?",
            "answer": "Check-in is at the front desk of Hooptown (6910 Stroop Ln, Smyrna). Please arrive 30 minutes early."
        },
        {
            "question": "What is the cost?",
            "answer": "Tryout fees: $65 (Early), $70 (Regular), $75 (Late/Walk-up)."
        },
        {
            "question": "What do I need to be ready for?",
            "answer": "Bring water, knee pads, and court shoes. Ensure SRVA membership and medical forms are complete."
        },
        {
            "question": "Who are the sponsors?",
            "answer": "Our official sponsors are Cerina Craig (Real Estate) and Shane Electric."
        }
    ]

    kb['last_agent_run'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Save
    with open(KB_FILE, 'w') as f:
        json.dump(kb, f, indent=2)

    print(f"Knowledge base '{KB_FILE}' updated at {kb['last_agent_run']}")

def run_daemon():
    print("Starting News Expert Agent in daemon mode...")
    while True:
        now = datetime.datetime.now()
        # Calculate target time: today at 12:00 PM
        target = now.replace(hour=12, minute=0, second=0, microsecond=0)

        # If it's already past 12:00 PM today, target 12:00 PM tomorrow
        if now >= target:
            target += datetime.timedelta(days=1)

        wait_seconds = (target - now).total_seconds()
        print(f"Next update scheduled for {target}. Sleeping for {wait_seconds:.0f} seconds.")

        # In a real environment, we'd sleep. For this sandbox, we'll run once and then exit if needed,
        # but the logic for a daemon is here.
        time.sleep(min(wait_seconds, 3600)) # Sleep at most 1 hour to stay responsive

        if datetime.datetime.now() >= target:
            update_knowledge_base()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mid TN VBC News Expert Agent")
    parser.add_argument("--daemon", action="store_true", help="Run as a daemon (updates at noon daily)")
    args = parser.parse_args()

    if args.daemon:
        # For the sake of this environment and testing, we might want to run once first
        update_knowledge_base()
        run_daemon()
    else:
        update_knowledge_base()
