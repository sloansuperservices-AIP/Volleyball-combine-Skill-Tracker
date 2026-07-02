import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os

# Configuration
CLUB_URL = "https://www.midtnvbc.com/"
USA_VB_URL = "https://usavolleyball.org/news/"
SRVA_URL = "https://www.srva.org/"
KB_FILE = "knowledge_base.json"
RULES_KB_FILE = "rules_kb.json"

def get_club_news():
    print("Fetching club news...")
    try:
        # Since I can't easily crawl the whole dynamic site in a simple script without more tools,
        # I'll scrape the main news listing if possible or use the sitemap news entries.
        # For this demo, I'll scrape the home page for any recent news articles.
        response = requests.get(CLUB_URL)
        soup = BeautifulSoup(response.text, 'html.parser')
        news_items = []
        # SportsEngine news usually in specific classes
        for article in soup.select('.newsSlideShow-item, .article'):
            title = article.get_text(strip=True)
            link = article.find('a')['href'] if article.find('a') else CLUB_URL
            news_items.append({"title": title, "link": link, "source": "Club Website"})
        return news_items[:5] # Return top 5
    except Exception as e:
        print(f"Error fetching club news: {e}")
        return []

def get_usav_updates():
    print("Fetching USA Volleyball updates...")
    try:
        response = requests.get(USA_VB_URL)
        soup = BeautifulSoup(response.text, 'html.parser')
        updates = []
        # Basic scraping for USAV news titles
        for item in soup.select('h3.post-title, .entry-title'):
            title = item.get_text(strip=True)
            link = item.find('a')['href'] if item.find('a') else USA_VB_URL
            updates.append({"title": title, "link": link, "source": "USA Volleyball"})
        return updates[:5]
    except Exception as e:
        print(f"Error fetching USAV updates: {e}")
        return []

def get_social_placeholders():
    # Placeholder for Instagram/Facebook integration
    # Real implementation would use Graph API or similar
    return [
        {"title": "Check our Instagram for latest training photos!", "link": "https://www.instagram.com/midtnvbc/", "source": "Instagram"},
        {"title": "Join our Facebook community for parent updates.", "link": "https://www.facebook.com/MidTNVBC", "source": "Facebook"}
    ]

def update_kb():
    # Load existing rules
    with open(RULES_KB_FILE, 'r') as f:
        rules = json.load(f)

    # Scrape news
    club_news = get_club_news()
    usav_news = get_usav_updates()
    social_news = get_social_placeholders()

    # Combine data
    kb_data = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "club_info": {
            "name": "Mid TN Volleyball Club",
            "location": {
                "main": "6910 Stroop Ln, Smyrna, TN 37167 (Hooptown Sportplex)",
                "beach": "2310 Memorial Blvd, Murfreesboro, TN 37129 (Sportscom)"
            },
            "contact": {
                "general": "info@midtnvbc.com",
                "recruiting": "Recruiting@midtnvbc.com"
            },
            "programs": [
                {"name": "Volley Tots", "ages": "4-8", "description": "Beginner fundamentals, agility, coordination."},
                {"name": "Volley Jrs", "ages": "9-13", "description": "Skill strengthening and simple game concepts."},
                {"name": "Academy/League", "ages": "12-18", "description": "4 weeks training + 4 weeks gameplay."},
                {"name": "Club", "ages": "12-18", "description": "Competitive program, multiple practices/week, tournaments."}
            ],
            "tryouts": {
                "dates_2026": "July 11th & 12th (13s-18s), Sept 20th (12U)",
                "costs": "$65 (early), $70 (after June 15/Aug 20), $75 (late/at door)",
                "requirements": ["USAV/SRVA Membership", "Online Registration", "Non-refundable fee"]
            }
        },
        "rules": rules,
        "latest_news": club_news + usav_news + social_news
    }

    with open(KB_FILE, 'w') as f:
        json.dump(kb_data, f, indent=2)
    print(f"Knowledge base updated at {kb_data['last_updated']}")

if __name__ == "__main__":
    update_kb()
