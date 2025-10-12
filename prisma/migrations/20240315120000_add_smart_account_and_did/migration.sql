-- CreateTable
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "email_verified" DATETIME,
    "image" TEXT,
    "wallet_address" TEXT,
    "smart_account_address" TEXT,
    "hedera_did" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "name", "email", "email_verified", "image", "wallet_address", "created_at", "updated_at") SELECT "id", "name", "email", "email_verified", "image", "wallet_address", "created_at", "updated_at" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_wallet_address_key" ON "User"("wallet_address");
CREATE UNIQUE INDEX "User_smart_account_address_key" ON "User"("smart_account_address");
CREATE UNIQUE INDEX "User_hedera_did_key" ON "User"("hedera_did");
