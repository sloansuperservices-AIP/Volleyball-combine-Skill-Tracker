import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("1. Testing Walkup Registration Flow...")
        await page.goto("http://localhost:8080/tryouts/index.html?mode=walkup")
        await page.fill("input >> nth=0", "TestFirst")
        await page.fill("input >> nth=1", "TestLast")
        await page.fill("input >> nth=3", "615-555-0199")
        await page.fill("input[type='email']", "testparent@example.com")
        await page.click("button:has-text('Submit & Register')")
        await page.wait_for_selector("text=Next Step: Proceed directly to Station 1")
        print("✓ Walkup registration verified.")

        print("2. Testing Head Coach Dashboard...")
        await page.goto("http://localhost:8080/tryouts/index.html")
        await page.fill("input[type='password']", "0000")
        await page.click("button:has-text('Log In')")
        await page.wait_for_selector("button:has-text('Depth Chart')")
        print("✓ Head Coach logged in.")

        print("3. Testing Depth Chart View & Mode Toggle...")
        await page.click("button:has-text('Depth Chart')")
        await page.wait_for_selector("button:has-text('Primary Pos')")
        await page.click("button:has-text('Multi-Position')")
        await page.wait_for_selector("text=all position eligibilities")
        await page.click("button:has-text('Primary Pos')")
        print("✓ Depth Chart view modes verified.")

        print("4. Testing Athlete Modal Notes & Restrictions...")
        await page.click("button:has-text('All Reg')")
        await page.click("td:has-text('Ardissono') >> nth=0")
        await page.wait_for_selector("text=Tryout Notes & Call Log")
        print("✓ Athlete Modal notes & call log verified.")

        await page.screenshot(path="verify_full_flow.png")
        await browser.close()
        print("ALL END-TO-END TESTS PASSED SUCCESSFULLY!")

asyncio.run(run())
