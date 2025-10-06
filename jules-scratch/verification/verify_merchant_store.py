import time
from playwright.sync_api import sync_playwright, Page, expect

# --- Test Credentials ---
TEST_EMAIL = "merchant-test-user-final-2@example.com"
TEST_PASSWORD = "SecurePassword123"
TEST_FIRST_NAME = "Test"
TEST_LAST_NAME = "Merchant"
TEST_STORE_NAME = "The Final Test Store"

def register_merchant(page: Page):
    """Registers a new merchant user using the dedicated page."""
    print("--- Starting Merchant Registration ---")
    page.goto("http://localhost:3000/auth/merchant-register", timeout=60000)
    print("Navigated to /auth/merchant-register.")

    # Fill in registration form
    page.get_by_label("First Name").fill(TEST_FIRST_NAME)
    page.get_by_label("Last Name").fill(TEST_LAST_NAME)
    page.get_by_label("Store Name").fill(TEST_STORE_NAME)
    page.get_by_label("Email").fill(TEST_EMAIL)
    page.get_by_label("Password").fill(TEST_PASSWORD)
    print("Filled out merchant registration form.")

    # Submit the form
    register_button = page.get_by_role("button", name="Register")
    expect(register_button).to_be_enabled()
    register_button.click()
    print("Submitted registration form.")

    # Wait for the success toast and redirection
    expect(page.get_by_text("Merchant registration successful!")).to_be_visible(timeout=10000)
    print("Registration successful toast appeared.")
    expect(page).to_have_url(lambda url: "/auth/login" in url, timeout=15000)
    print("Redirected to login page.")

def login_merchant(page: Page):
    """Logs in as the merchant."""
    print("\n--- Starting Merchant Login ---")

    # The page should already be on the login page after registration
    # Fill in login form
    page.get_by_label("Email").first.fill(TEST_EMAIL)
    page.get_by_label("Password").first.fill(TEST_PASSWORD)
    print("Filled out login form.")

    # Submit the form
    sign_in_button = page.get_by_role("button", name="Sign In")
    expect(sign_in_button).to_be_enabled()
    sign_in_button.click()
    print("Submitted login form.")

    # Wait for the success toast and navigation
    expect(page.get_by_text("Login successful!")).to_be_visible(timeout=10000)
    print("Login successful toast appeared.")

    # Expect redirection to the dashboard
    expect(page).to_have_url(lambda url: "/dashboard" in url, timeout=15000)
    print("Redirected to dashboard.")

def verify_store_page(page: Page):
    """Verifies the content of the merchant store page."""
    print("\n--- Verifying Merchant Store Page ---")

    # Navigate to the merchant store page
    page.goto("http://localhost:3000/merchant/store", timeout=60000)
    print("Navigated to /merchant/store.")

    # Assert: Check for the main heading.
    heading = page.get_by_role("heading", name="My Store")
    expect(heading).to_be_visible(timeout=10000)
    print("Heading 'My Store' is visible.")

    # Assert: Check for the Store Profile card.
    store_profile_card_title = page.get_by_role("heading", name="Store Profile")
    expect(store_profile_card_title).to_be_visible()
    print("Card 'Store Profile' is visible.")

    # Assert: Check for the Products card and the "Add Product" button.
    products_card_title = page.get_by_role("heading", name="Products")
    expect(products_card_title).to_be_visible()
    print("Card 'Products' is visible.")

    add_product_button = page.get_by_role("button", name="Add Product")
    expect(add_product_button).to_be_visible()
    print("Button 'Add Product' is visible.")

    # Screenshot: Capture the final result for visual verification.
    screenshot_path = "jules-scratch/verification/merchant_store_page.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Run the full workflow
        register_merchant(page)
        login_merchant(page)
        verify_store_page(page)

        browser.close()
        print("\nVerification script completed successfully!")

if __name__ == "__main__":
    main()