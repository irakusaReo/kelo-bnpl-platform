from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:3000/auth/login")

        # Fill in the credentials
        page.get_by_label("Email").fill("test@example.com")
        page.get_by_label("Password").fill("password")

        # Click the login button
        page.get_by_role("button", name="Sign In").click()

        # Wait for the dashboard to load and verify the URL
        expect(page).to_have_url("http://localhost:3000/dashboard")

        # Verify that the dashboard heading is visible
        dashboard_heading = page.get_by_role("heading", name="Kelo Dashboard")
        expect(dashboard_heading).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
