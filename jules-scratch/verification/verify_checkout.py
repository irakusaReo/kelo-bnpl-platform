from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the checkout page with a dummy product ID
    page.goto("http://localhost:3000/checkout?productId=123")

    # Wait for the page to load and check for the main heading
    # This confirms the page is rendering without crashing.
    page.wait_for_selector("h1")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/checkout_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)