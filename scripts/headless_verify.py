import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

screenshot_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "screenshots"))
os.makedirs(screenshot_dir, exist_ok=True)

def run():
    with sync_playwright() as p:
        print("Launching headless Chromium...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"BROWSER CONSOLE [{msg.type}]: {msg.text}"))

        # Step 1: Open Dashboard Directly
        url = "http://localhost:5173/dashboard"
        print(f"Navigating directly to {url}...")
        try:
            page.goto(url, timeout=10000)
        except Exception as e:
            print(f"Error loading dashboard: {e}. Checking again in 3 seconds...")
            time.sleep(3)
            page.goto(url)

        time.sleep(2)
        # Take dashboard screenshot
        dash_screenshot = os.path.join(screenshot_dir, "03_user_dashboard.png")
        page.screenshot(path=dash_screenshot)
        print(f"Saved: {dash_screenshot}")

        # Step 2: Go to Legal Chat directly
        chat_url = "http://localhost:5173/chat"
        print(f"Navigating directly to {chat_url}...")
        page.goto(chat_url)
        time.sleep(2)

        # Take chat initial screenshot
        chat_init_screenshot = os.path.join(screenshot_dir, "04_chat_initial.png")
        page.screenshot(path=chat_init_screenshot)
        print(f"Saved: {chat_init_screenshot}")

        # Ask a legal question
        question = "What is the notice period for employee termination?"
        print(f"Submitting question: '{question}'")
        
        # Try different selectors to type
        try:
            page.click("textarea")
            time.sleep(0.5)
            page.type("textarea", question)
            print("Typed question in textarea")
            time.sleep(0.5)
            page.click("#chat-send-btn")
            print("Clicked send button")
        except Exception as e:
            print(f"Error during typing/submitting: {e}")

        # Wait for response (look for the bubble with 'Based on the available legal documents' or error fallback)
        print("Waiting for RAG answer...")
        time.sleep(10)  # Wait for API fetch to finish and DOM to update

        # Take chat response screenshot
        chat_resp_screenshot = os.path.join(screenshot_dir, "05_chat_response.png")
        page.screenshot(path=chat_resp_screenshot)
        print(f"Saved: {chat_resp_screenshot}")

        # Step 3: Go to Analytics directly
        analytics_url = "http://localhost:5173/analytics"
        print(f"Navigating directly to {analytics_url}...")
        page.goto(analytics_url)
        time.sleep(2)

        # Take analytics screenshot
        analytics_screenshot = os.path.join(screenshot_dir, "06_analytics_page.png")
        page.screenshot(path=analytics_screenshot)
        print(f"Saved: {analytics_screenshot}")

        print("Headless E2E flow completed successfully!")
        browser.close()

if __name__ == "__main__":
    run()
