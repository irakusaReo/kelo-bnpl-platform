from playwright.sync_api import sync_playwright, Page, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Give the server time to start
        print("Waiting for dev server to be ready...")
        time.sleep(15)

        # Marketplace page
        print("Navigating to Marketplace page...")
        page.goto("http://localhost:3000/marketplace", wait_until="networkidle")
        expect(page.get_by_role("heading", name="Marketplace")).to_be_visible()
        print("Marketplace page loaded. Taking screenshot...")
        page.screenshot(path="jules-scratch/verification/01_marketplace.png")

        # Product detail page - click the first product
        print("Navigating to Product Detail page...")
        # Find the first product link and click it
        first_product_link = page.locator('a[href^="/marketplace/"]').first
        expect(first_product_link).to_be_visible()
        product_href = first_product_link.get_attribute("href")
        print(f"Clicking first product: {product_href}")
        first_product_link.click()

        page.wait_for_url(f"http://localhost:3000{product_href}", wait_until="networkidle")
        expect(page.get_by_role("link", name="Buy now, Pay later")).to_be_visible()
        print("Product Detail page loaded. Taking screenshot...")
        page.screenshot(path="jules-scratch/verification/02_product-detail.png")

        # Checkout flow - Delivery
        print("Navigating to Checkout page...")
        page.get_by_role("link", name="Buy now, Pay later").click()
        expect(page.get_by_role("heading", name="Checkout")).to_be_visible()
        expect(page.get_by_text("Delivery Address")).to_be_visible()
        print("Checkout (Delivery) page loaded. Taking screenshot...")
        page.screenshot(path="jules-scratch/verification/03_checkout-delivery.png")

        # Checkout flow - Payment
        print("Confirming address and proceeding to Payment...")
        page.get_by_role("button", name="Confirm Address").click()
        expect(page.get_by_text("Payment Method")).to_be_visible()
        print("Checkout (Payment) page loaded. Taking screenshot...")
        page.screenshot(path="jules-scratch/verification/04_checkout-payment.png")

        # Checkout flow - Confirmation
        print("Confirming payment and proceeding to Confirmation...")
        page.get_by_role("button", name="Continue").click()
        expect(page.get_by_role("heading", name="Review")).to_be_visible()
        expect(page.get_by_role("button", name="Confirm Order")).to_be_visible()
        print("Checkout (Confirmation) page loaded. Taking screenshot...")
        page.screenshot(path="jules-scratch/verification/05_checkout-confirmation.png")

        print("Verification script completed successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)