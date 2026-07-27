#!/usr/bin/env python3
"""
Mid TN VBC Tryout Manager - Unified Quality Assurance Pipeline
Automates critical checks to ensure repository integrity and correctness.
"""
import sys
import os
import re
import json
import ast
import subprocess

def print_header(title):
    print("=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)

def check_html_js_syntax(filepath):
    print(f"[*] Checking internal JavaScript syntax in {filepath}...")
    if not os.path.exists(filepath):
        print(f"[!] Error: {filepath} not found.")
        return False

    try:
        content = open(filepath, 'r', encoding='utf-8').read()
        scripts = re.findall(r'<script(?:[^>]*)>(.*?)</script>', content, re.DOTALL)
        if not scripts:
            print("[*] No script blocks found in file.")
            return True

        all_ok = True
        for idx, script in enumerate(scripts):
            # Skip empty scripts or scripts that just load modules/src
            if not script.strip():
                continue

            temp_filename = f"temp_script_{idx}.js"
            with open(temp_filename, 'w', encoding='utf-8') as f:
                f.write(script)

            try:
                # Compile using node -c
                res = subprocess.run(['node', '-c', temp_filename], capture_output=True, text=True)
                if res.returncode == 0:
                    print(f"  [✓] Script block #{idx} is valid JavaScript.")
                else:
                    print(f"  [✗] Script block #{idx} has syntax errors:")
                    print(res.stderr)
                    all_ok = False
            finally:
                if os.path.exists(temp_filename):
                    os.remove(temp_filename)
        return all_ok
    except Exception as e:
        print(f"[!] Error checking {filepath}: {e}")
        return False

def check_js_file_syntax(filepath):
    print(f"[*] Checking JavaScript file syntax: {filepath}...")
    if not os.path.exists(filepath):
        print(f"[!] Error: {filepath} not found.")
        return False
    try:
        res = subprocess.run(['node', '-c', filepath], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"  [✓] {filepath} is valid JavaScript.")
            return True
        else:
            print(f"  [✗] {filepath} has syntax errors:")
            print(res.stderr)
            return False
    except Exception as e:
        print(f"[!] Error checking {filepath}: {e}")
        return False

def check_json_syntax(filepath):
    print(f"[*] Validating JSON structure & keys in {filepath}...")
    if not os.path.exists(filepath):
        print(f"[!] Error: {filepath} not found.")
        return False
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        required_keys = ["club_info", "news", "rules_and_regulations", "faq"]
        all_keys_exist = True
        for k in required_keys:
            if k in data:
                print(f"  [✓] Found key: '{k}'")
            else:
                print(f"  [✗] Missing key: '{k}'")
                all_keys_exist = False

        if all_keys_exist:
            print(f"  [✓] {filepath} is 100% valid and structured correctly.")
            return True
        return False
    except json.JSONDecodeError as e:
        print(f"  [✗] JSON Decode Error in {filepath}: {e}")
        return False
    except Exception as e:
        print(f"[!] Error checking {filepath}: {e}")
        return False

def check_python_syntax(filepath):
    print(f"[*] Validating Python syntax in {filepath}...")
    if not os.path.exists(filepath):
        print(f"[!] Error: {filepath} not found.")
        return False
    try:
        content = open(filepath, 'r', encoding='utf-8').read()
        ast.parse(content)
        print(f"  [✓] {filepath} has valid Python syntax.")
        return True
    except SyntaxError as e:
        print(f"  [✗] Python syntax error in {filepath}: {e}")
        return False
    except Exception as e:
        print(f"[!] Error checking {filepath}: {e}")
        return False

def main():
    print_header("MID TN VBC UNIFIED QA PIPELINE")

    html_ok = check_html_js_syntax("tryouts/index.html")
    chatbot_ok = check_js_file_syntax("chatbot.js")
    json_ok = check_json_syntax("volley_kb.json")
    py_ok = check_python_syntax("agent/news_expert.py")

    print_header("QA PIPELINE REPORT SUMMARY")
    success = True

    if html_ok:
        print("[✓] tryouts/index.html - PASSED")
    else:
        print("[✗] tryouts/index.html - FAILED")
        success = False

    if chatbot_ok:
        print("[✓] chatbot.js - PASSED")
    else:
        print("[✗] chatbot.js - FAILED")
        success = False

    if json_ok:
        print("[✓] volley_kb.json - PASSED")
    else:
        print("[✗] volley_kb.json - FAILED")
        success = False

    if py_ok:
        print("[✓] agent/news_expert.py - PASSED")
    else:
        print("[✗] agent/news_expert.py - FAILED")
        success = False

    print("-" * 60)
    if success:
        print("[SUCCESS] All pipeline checks passed successfully!")
        sys.exit(0)
    else:
        print("[FAILURE] Some pipeline checks failed. Please fix before pushing.")
        sys.exit(1)

if __name__ == "__main__":
    main()
