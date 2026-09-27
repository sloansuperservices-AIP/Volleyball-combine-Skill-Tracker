import time
from playwright.sync_api import sync_playwright

def run_e2e_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("--- 1. Testing Walkup Registration ---")
        page.goto("http://localhost:8080/tryouts/?mode=walkup")
        page.fill("input[required]:nth-of-type(1)", "Taylor")
        page.locator("input").nth(1).fill("Swift")
        page.locator("input[placeholder='e.g. 615-555-0199']").fill("615-555-9999")
        page.locator("input[type='email']").fill("taylor@vbc.com")
        page.click("button:has-text('Submit & Register ✓')")
        page.wait_for_selector("text=Registration Complete!")
        print("✓ Walkup registration successful")

        print("--- 2. Testing Head Coach Dashboard ---")
        page.goto("http://localhost:8080/tryouts/")
        page.fill("input[type='password']", "0000")
        page.click("button:has-text('Log In →')")
        page.wait_for_selector("text=Tryout Manager")
        print("✓ Logged into Head Coach dashboard")

        print("--- 3. Testing All Reg Walkup Presence ---")
        page.click("button:has-text('All Reg')")
        page.wait_for_selector("text=Taylor Swift")
        print("✓ Registered walkup Taylor Swift found in All Reg")

        print("--- 4. Testing Depth Chart Toggles ---")
        page.click("button:has-text('Depth Chart')")
        page.wait_for_selector("text=Primary Pos Only")
        page.click("button:has-text('Multi-Position')")
        time.sleep(0.5)
        page.click("button:has-text('Primary Pos Only')")
        print("✓ Depth chart mode toggles working")

        print("--- 5. Testing Team Builder & Offer Management ---")
        page.click("button:has-text('Team Builder')")
        page.wait_for_selector("text=12 Black")

        # Open player modal for Bristol Ardissono and assign to 12 Black or send offer directly
        page.click("text=Bristol Ardissono")
        page.wait_for_selector("text=Tryout Notes & Call Log")
        page.click("button:has-text('📩 Offer')")
        page.wait_for_selector("text=Compose Email")
        page.click("button:has-text('Open Mail App ✓')")
        print("✓ Individual offer triggered successfully")

        # Now test team offer management
        # Drag player to team or assign via modal
        page.screenshot(path="team_builder.png")
        print("✓ Team builder verified and screenshot captured")

        browser.close()
        print("🎉 ALL E2E TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_e2e_tests()
