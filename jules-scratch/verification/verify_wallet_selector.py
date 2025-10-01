from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the wallet dashboard page
        page.goto("http://localhost:3000/dashboard/wallet")

        # 2. Click the "Connect Wallet" button to open the dialog
        connect_wallet_button = page.get_by_role("button", name="Connect Wallet")
        expect(connect_wallet_button).to_be_visible()
        connect_wallet_button.click()

        # 3. Wait for the dialog to appear and take a screenshot
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        expect(dialog.get_by_text("MetaMask")).to_be_visible()
        expect(dialog.get_by_text("WalletConnect")).to_be_visible()
        expect(dialog.get_by_text("Coinbase Wallet")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        # 4. Clean up
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)