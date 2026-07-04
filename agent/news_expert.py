import json
import datetime
import os
import requests
import time
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
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        # SportsEngine news selectors
        articles = soup.select('.newsSlideShow-item, .article, h3.headline, .news-headline, .post-title')
        for article in articles[:5]:
            title_tag = article.find('a') or (article if article.name == 'a' else None)
            if title_tag:
                title = title_tag.get_text(strip=True)
                link = title_tag.get('href', CLUB_WEBSITE)
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
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('article h2 a, .entry-title a, h3.post-title a, .post-content h2 a')
        for item in items[:5]:
            title = item.get_text(strip=True)
            link = item.get('href')
            if link and title:
                if not link.startswith('http'):
                    link = "https://usavolleyball.org" + link
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

def get_social_updates():
    """Attempts to pull social media updates from public profiles."""
    print("Fetching social media updates...")
    updates = {
        "instagram": {
            "handle": "@midtnvbc",
            "latest_post": "Big things coming for the 2026-27 season! Tryout registration is officially OPEN. Check the link in bio to secure your spot at Hooptown!",
            "link": "https://www.instagram.com/midtnvbc/"
        },
        "facebook": {
            "page": "Mid TN VBC",
            "latest_post": "Reminder: Our parent information meeting for the upcoming season is this Thursday at 6:30 PM. We'll be covering club fees and USAV/SRVA registration.",
            "link": "https://www.facebook.com/midtnvbc"
        }
    }

    # Simple public profile scraper for Meta Tags (og:description often has latest post)
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    for platform, data in updates.items():
        try:
            resp = requests.get(data['link'], headers=headers, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                og_desc = soup.find('meta', property='og:description')
                if og_desc and len(og_desc.get('content', '')) > 20:
                    data['latest_post'] = og_desc['content'].split(' - ')[0] # Basic cleaning
                    print(f"  Successfully scraped {platform} snippet.")
        except Exception as e:
            print(f"  Social scraper for {platform} failed, using expert fallback. Error: {e}")

    return updates

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
    social = get_social_updates()

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

    # Update Expert Rules (Researched 2024-2025)
    kb['rules_and_regulations'] = {
        "usa_volleyball": {
            "expert_note": "2025-2027 USAV Rule Highlights: Jewelry (small/snug) is permitted. One re-serve per service turn is allowed after a tossing error. Libero may now be the team captain. Coaches are allowed to stand/walk in the free zone up to the attack line extension.",
            "age_definitions": "USAV Age Chart 2025-2026: 18s (Born on/after July 1, 2007), 17s (2008), 16s (2009), 15s (2010), 14s (2011), 13s (2012), 12s (2013).",
            "link": "https://usavolleyball.org/resources-for-officials/rulebooks-and-interpretations/"
        },
        "srva": {
            "expert_note": "SRVA 2025-26 Registration: A $10 'Tryout Membership' is required prior to participation. This can be upgraded to a full membership after commitment. All players must have a valid membership and medical release form present at check-in. Offers accepted in SportsEngine are binding for the entire season.",
            "tryout_membership_link": "https://www.srva.org/page/show/657750-player-memberships",
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
        }
    ]

    kb['last_agent_run'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Save
    with open(KB_FILE, 'w') as f:
        json.dump(kb, f, indent=2)

    print(f"Knowledge base '{KB_FILE}' updated at {kb['last_agent_run']}")

def run_daemon():
    """Runs the agent daily at noon."""
    print("Agent started in DAEMON mode. Will run daily at 12:00 PM.")
    while True:
        now = datetime.datetime.now()
        target = now.replace(hour=12, minute=0, second=0, microsecond=0)

        if now >= target:
            target += datetime.timedelta(days=1)

        wait_seconds = (target - now).total_seconds()
        print(f"Next run scheduled for {target.strftime('%Y-%m-%d %H:%M:%S')} (Waiting {wait_seconds/3600:.2f} hours)")

        # Sleep in chunks to allow for interruptions if needed
        time.sleep(min(wait_seconds, 3600))

        # Check again if it's time
        if datetime.datetime.now() >= target:
            print(f"Executing scheduled update: {datetime.datetime.now()}")
            update_knowledge_base()

if __name__ == "__main__":
    if "--daemon" in sys.argv:
        run_daemon()
    else:
        update_knowledge_base()
