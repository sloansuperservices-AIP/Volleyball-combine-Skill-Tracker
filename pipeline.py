#!/usr/bin/env python3
import os
import sys
import json
import subprocess

def print_header(title):
    print("=" * 60)
    print(f" {title}")
    print("=" * 60)

def check_html_js_syntax():
    print("Checking JavaScript syntax inside tryouts/index.html...")
    html_path = "tryouts/index.html"
    if not os.path.exists(html_path):
        print(f"❌ Error: {html_path} does not exist.")
        return False

    try:
        content = open(html_path, "r", encoding="utf-8").read()
        start_marker = "const {h,render,Fragment}=preact;"
        start_idx = content.find(start_marker)
        end_idx = content.find("</script>", start_idx) if start_idx != -1 else -1

        if start_idx == -1 or end_idx == -1:
            print("❌ Error: Could not find JavaScript boundaries inside index.html.")
            return False

        js_code = content[start_idx:end_idx]
        temp_file = "temp_pipeline_check.js"
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(js_code)

        result = subprocess.run(["node", "-c", temp_file], capture_output=True, text=True)
        if os.path.exists(temp_file):
            os.remove(temp_file)

        if result.returncode != 0:
            print("❌ JavaScript Syntax Error found:")
            print(result.stderr)
            return False

        print("✅ JavaScript syntax is perfectly valid!")
        return True
    except Exception as e:
        print(f"❌ Error processing HTML JS syntax: {e}")
        return False

def check_json_file(filepath):
    print(f"Validating JSON integrity for {filepath}...")
    if not os.path.exists(filepath):
        print(f"❌ Error: {filepath} does not exist.")
        return False

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"✅ {filepath} is valid and parsed successfully!")
        return data
    except Exception as e:
        print(f"❌ Error parsing {filepath}: {e}")
        return False

def check_scraping_agent():
    print("Validating scraping agent syntax (agent/news_expert.py)...")
    agent_path = "agent/news_expert.py"
    if not os.path.exists(agent_path):
        print(f"❌ Error: {agent_path} does not exist.")
        return False

    try:
        # Check python syntax using python's compile function
        content = open(agent_path, "r", encoding="utf-8").read()
        compile(content, agent_path, "exec")
        print("✅ Python scraping agent has valid syntax!")
        return True
    except Exception as e:
        print(f"❌ Python syntax error inside scraping agent: {e}")
        return False

def check_pipeline_collaboration():
    print("Checking repository collaborative documentation...")
    agents_doc = "AGENTS.md"
    if not os.path.exists(agents_doc):
        print("❌ Warning: AGENTS.md not found.")
        return False
    print("✅ AGENTS.md document is present.")
    return True

def main():
    print_header("Mid TN VBC Tryout Manager - QA Pipeline Script")

    success = True

    # 1. Check HTML JS
    if not check_html_js_syntax():
        success = False
        print()

    # 2. Check volley_kb.json
    kb_data = check_json_file("volley_kb.json")
    if not kb_data:
        success = False
    else:
        # Verify essential keys are present
        required_keys = ["club_info", "news", "rules_and_regulations", "faq"]
        missing = [k for k in required_keys if k not in kb_data]
        if missing:
            print(f"❌ Error: volley_kb.json is missing required keys: {missing}")
            success = False
        else:
            print("✅ volley_kb.json contains all required schema keys.")
    print()

    # 3. Check data/knowledge_base.json
    if not check_json_file("data/knowledge_base.json"):
        success = False
    print()

    # 4. Check scraping agent
    if not check_scraping_agent():
        success = False
    print()

    # 5. Check collaborative documentation
    check_pipeline_collaboration()
    print()

    print_header("QA PIPELINE RESULTS SUMMARY")
    if success:
        print("🎉 ALL SYSTEMS GO! Roster management and knowledge base checks passed successfully.")
        sys.exit(0)
    else:
        print("❌ QA pipeline failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
