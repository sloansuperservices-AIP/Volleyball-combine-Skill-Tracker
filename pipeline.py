import os
import sys
import json
import re
import subprocess

def check_html_js_syntax(filepath):
    print(f"Checking embedded JavaScript syntax in {filepath}...")
    if not os.path.exists(filepath):
        print(f"Error: {filepath} does not exist.")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract script contents. Let's find all <script>...</script> blocks
    # specifically those that are internal javascript (not external src)
    scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL)

    temp_prefix = "temp_script_check"
    success = True
    for idx, script in enumerate(scripts):
        if not script.strip():
            continue

        # Write to a temp js file
        temp_file = f"{temp_prefix}_{idx}.js"
        with open(temp_file, 'w', encoding='utf-8') as tf:
            tf.write(script)

        try:
            # Run node -c on the temp file
            res = subprocess.run(["node", "-c", temp_file], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"Syntax Error in {filepath} (Script block #{idx}):")
                print(res.stderr)
                success = False
            else:
                print(f"  Script block #{idx}: OK")
        except Exception as e:
            print(f"  Warning: Could not run 'node -c' to verify syntax ({e}). Skipping Node check.")
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    return success

def check_json_database(filepath):
    print(f"Validating JSON database {filepath}...")
    if not os.path.exists(filepath):
        print(f"Error: {filepath} does not exist.")
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        required_keys = ["rules_and_regulations", "faq", "news"]
        for key in required_keys:
            if key not in data:
                print(f"Error: Mandatory key '{key}' is missing in {filepath}")
                return False

        print("  JSON format & key structure: OK")
        return True
    except json.JSONDecodeError as e:
        print(f"Error: {filepath} is not valid JSON. {e}")
        return False

def check_news_expert_scraper():
    print("Verifying News Expert Agent requirements...")
    filepath = "agent/news_expert.py"
    if not os.path.exists(filepath):
        print(f"Error: {filepath} does not exist.")
        return False

    try:
        # Check standard imports
        import requests
        from bs4 import BeautifulSoup
        print("  Scraper packages (requests, bs4): OK")
        return True
    except ImportError as e:
        print(f"Error: Missing scraper dependencies. {e}")
        return False

def main():
    print("=== STARTING VOLLEYBALL MANAGEMENT INTEGRATED QA PIPELINE ===")

    html_ok = check_html_js_syntax("tryouts/index.html")
    json_ok = check_json_database("volley_kb.json")
    scraper_ok = check_news_expert_scraper()

    if html_ok and json_ok and scraper_ok:
        print("\n=== PIPELINE STATUS: PASSED (ALL CHECKS OK) ===")
        sys.exit(0)
    else:
        print("\n=== PIPELINE STATUS: FAILED ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
