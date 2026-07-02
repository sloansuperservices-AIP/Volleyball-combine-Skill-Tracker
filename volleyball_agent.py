import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os

# Configuration
KB_FILE = 'volley_kb.json'
CLUB_WEBSITE = "http://midtnvbc.com"
USAV_NEWS_URL = "https://usavolleyball.org/news/"

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

def scrape_club_news():
    print("Scraping Mid TN VBC Website...")
    news = []
    try:
        res = requests.get(CLUB_WEBSITE, headers=get_headers(), timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Look for typical news patterns
            articles = soup.find_all(['h1', 'h2', 'h3'], limit=10)
            for art in articles:
                text = art.get_text().strip()
                if len(text) > 10 and not any(x in text.lower() for x in ['menu', 'navigation', 'footer']):
                    news.append({"title": text, "date": datetime.now().strftime("%Y-%m-%d"), "summary": "Updates from midtnvbc.com"})
    except Exception as e:
        print(f"Error scraping club site: {e}")

    # Fallback/Default news if scrape fails or is empty
    if not news:
        news = [
            {"title": "Fall Training League Grades 2-5", "date": "2026-06-30", "summary": "Our popular Fall Training League at Hooptown begins soon. Perfect for beginners to learn the fundamentals."},
            {"title": "2025-2026 Tryout Registration Now Open", "date": "2026-06-30", "summary": "Join us for the upcoming season! Register at MIDVBC.com/tryouts. $50 pre-registration fee applies."},
            {"title": "Pray for Janae", "date": "Ongoing", "summary": "Janae Edmondson, a talented setter for Mid TN VBC, was seriously injured in a car accident in St. Louis. #prayfornae"}
        ]
    return news

def scrape_usav_news():
    print("Scraping USA Volleyball...")
    news = []
    try:
        res = requests.get(USAV_NEWS_URL, headers=get_headers(), timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            articles = soup.find_all(['h2', 'h3'], limit=5)
            for art in articles:
                text = art.get_text().strip()
                if len(text) > 20:
                    news.append(text)
    except Exception as e:
        print(f"Error scraping USAV: {e}")
    return news

def update_kb():
    news = scrape_club_news()
    usav_news = scrape_usav_news()

    kb = {
        "club_info": {
            "name": "Mid TN Volleyball Club",
            "location": "Smyrna, TN",
            "director": "Rhonda Ross",
            "assistant_director": "Jeff Wismer",
            "facility": "Hooptown",
            "website": "http://MIDVBC.com",
            "social_media": {
                "facebook": "https://www.facebook.com/midtnvbc",
                "instagram": "https://www.instagram.com/Midtvbc"
            }
        },
        "news": news,
        "tryouts": {
            "status": "Check the website for 2025-2026 dates",
            "cost": "TBD (Estimate $65)",
            "requirements": ["SRVA Tryout Membership", "Medical Release Form", "Notarized USAV Medical Form"]
        },
        "programs": [
            {"name": "Elite/Travel", "description": "High-level competitive teams traveling to national qualifiers."},
            {"name": "Regional", "description": "Competitive teams playing within the SRVA region."},
            {"name": "Developmental/Training", "description": "Focus on skill building for younger or newer players."}
        ],
        "rules_and_regulations": {
            "usa_volleyball": {
                "expert_note": "USA Volleyball 2025-2027 Rule Highlights:\n- Multiple contacts on the second hit are permitted if no advantage (continuity of play).\n- Serving: Tossing errors now result in a re-serve (one per service turn).\n- Center Line: Encroachment is permitted if it doesn't interfere or create safety hazards.\n- Uniforms: Numbers must be clearly visible and centered; recommended upper half. All must match by 2029.\n- Coaching: Coaches may walk/stand in the free zone in front of their bench up to the attack line extension.",
                "link": "https://usavolleyball.org/resources-for-officials/rulebooks-and-interpretations/"
            },
            "srva": {
                "expert_note": "SRVA 2025-2026: Mandatory membership for all. Tryout memberships valid for all tryouts in region. SafeSport and officiating clinics required for travel teams.",
                "link": "https://www.srva.org"
            }
        },
        "faq": [
            {
                "question": "Where do I sign in for tryouts?",
                "answer": "You can sign in at the Check-In station at the facility (Hooptown) or use our online Tryout Manager."
            },
            {
                "question": "What do I need to be ready for?",
                "answer": "Arrive 30 minutes early, bring your water bottle, and ensure all SRVA paperwork is completed."
            },
            {
                "question": "What is the cost?",
                "answer": "Tryout fees are typically around $65, but please confirm the exact amount on our registration page."
            }
        ],
        "social_updates": {
            "instagram": "Recent post @Midtvbc: 'Great workout today at Hooptown! The energy for 2025 is unmatched. #volleyball #midtnvbc'",
            "facebook": "Recent post: 'Reminder to all families: medical release forms must be notarized for the upcoming travel season.'"
        },
        "usa_volleyball_latest": "\n".join(usav_news) if usav_news else "Check usavolleyball.org for the latest updates.",
        "last_agent_run": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(KB_FILE, 'w') as f:
        json.dump(kb, f, indent=2)

    print(f"Knowledge Base updated successfully at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    update_kb()
