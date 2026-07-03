import json
import datetime
import os
import requests
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
    """
    Placeholders for Instagram/Facebook integration.
    Actual implementation would use:
    - Facebook Graph API (for FB)
    - Instagram Graph API or unofficial scrapers like instaloader (for IG)
    Requires developer credentials/tokens.
    """
    return {
        "instagram": "Latest from @midtnvbc: 'Summer camps are here! From Fun with Fundamentals to Tryout Tune Ups, we have something for everyone. #MidTNVBC #VolleyballCamps'",
        "facebook": "Recent Post: '2026-2027 Tryouts are just around the corner! July 11-12 for 13s-18s and Sept 20 for 12s. Register early to save on fees!'"
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
            "expert_note": "2023-2025 USAV DCR Highlights: Rule 5.3.1 - One assistant coach may stand to give instructions within the free zone (extension of attack line to warm-up area). Rule 12.4.4 - For 14U and under, one service tossing error (catch or drop) is allowed per service turn, resulting in a re-serve. Rule 4.3.3.1a - Uniform numbers must be centered and clearly visible.",
            "link": "https://usavolleyball.org/resources-for-officials/rulebooks-and-interpretations/"
        },
        "srva": {
            "expert_note": "SRVA Policies: Tryout fee is capped at $75. Participants must have a valid USAV membership via SRVA before participating in tryouts. Offers accepted in SportsEngine are binding for the season.",
            "link": "https://www.srva.org"
        }
    }

    # Update FAQs
    kb['faq'] = [
        {
            "question": "Where do I sign in for tryouts?",
            "answer": "Check-in is at the front desk of Hooptown (6910 Stroop Ln, Smyrna). Doors open 30 minutes prior to your scheduled tryout time."
        },
        {
            "question": "What is the cost?",
            "answer": "Tryout fees: $65 (Early), $70 (Regular), $75 (Late/Walk-up). 13s-18s fee increases June 15 and July 4. 12s fee increases Aug 20 and Sept 13."
        },
        {
            "question": "What do I need to be ready for?",
            "answer": "Athletes should bring water, knee pads, and appropriate court shoes. You must have your USAV membership via SRVA and online registration completed."
        },
        {
            "question": "When will we know about team offers?",
            "answer": "Initial offers are typically made within 24-48 hours after the conclusion of tryouts for your age group via email/SportsEngine."
        }
    ]

    kb['last_agent_run'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Save
    with open(KB_FILE, 'w') as f:
        json.dump(kb, f, indent=2)

    print(f"Knowledge base '{KB_FILE}' updated at {kb['last_agent_run']}")

if __name__ == "__main__":
    update_knowledge_base()
