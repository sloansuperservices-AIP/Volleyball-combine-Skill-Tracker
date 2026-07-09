from playwright.sync_api import sync_playwright
import os
import subprocess
import time

def run_cuj(page):
    errors = []
    page.on("pageerror", lambda exc: errors.append(exc.message))
    page.on("console", lambda msg: print(f"PAGE LOG: [{msg.type}] {msg.text}"))

    server = subprocess.Popen(["python3", "-m", "http.server", "3000"])
    time.sleep(2)

    try:
        page.goto("http://localhost:3000/tryouts/index.html")
        page.wait_for_timeout(5000)

        # Check if #app has content and is not the loading state
        app_html = page.inner_html("#app")
        print(f"App HTML length: {len(app_html)}")

        if "Loading Tryout Manager..." in app_html:
             print("App is still in LOADING state.")
        elif len(app_html) > 0:
            print("App rendered SUCCESSFULLY.")
        else:
            print("App is EMPTY.")

        page.screenshot(path="/home/jules/verification/screenshots/verify_fix_esm.png")

    finally:
        server.terminate()

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
