from playwright.sync_api import sync_playwright, expect
import time

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Give the server a few seconds to warm up
        time.sleep(5)

        # Navigate to the Stores page using the direct IP
        page.goto("http://127.0.0.1:3000/stores")
        expect(page.get_by_role("heading", name="Discover Stores")).to_be_visible(timeout=10000)
        page.screenshot(path="jules-scratch/verification/01_stores_page.png")

        # Navigate to the Marketplace page by clicking the header link
        # The link might not be visible immediately, so we wait
        marketplace_link = page.get_by_role("link", name="Marketplace")
        expect(marketplace_link).to_be_visible()
        marketplace_link.click()

        expect(page.get_by_role("heading", name="Marketplace")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_marketplace_page.png")

        # Click on the first product card to go to its detail page
        first_product_card = page.locator('.grid > div').first
        expect(first_product_card).to_be_visible()
        first_product_card.click()

        expect(page.get_by_role("button", name="Add to Cart")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/03_product_detail_page.png")

        # Add the item to the cart
        page.get_by_role("button", name="Add to Cart").click()

        # Go to the cart page
        cart_link = page.get_by_role("link", name="Shopping Cart")
        expect(cart_link).to_be_visible()
        cart_link.click()

        expect(page.get_by_role("heading", name="Your Cart")).to_be_visible()
        expect(page.locator("text=Order Summary")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/04_cart_page.png")

        # Proceed to checkout
        checkout_link = page.get_by_role("link", name="Proceed to Checkout")
        expect(checkout_link).to_be_visible()
        checkout_link.click()

        expect(page.get_by_role("heading", name="Checkout")).to_be_visible()
        expect(page.get_by_role("button", name="Confirm Purchase")).to_be_visible()

        # Final screenshot of the checkout page
        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
