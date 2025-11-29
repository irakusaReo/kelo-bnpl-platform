// src/app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSmartAccount, createHederaDID, associateDIDWithSmartAccount } from "@/services/smartAccountService";

export async function POST(request: Request) {
  const { email, password, firstName, lastName, phone } = await request.json();

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Create Supabase User
  const { data: { user }, error: creationError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      role: "user",
    },
  });

  if (creationError) {
    console.error("Supabase user creation error:", creationError.message);
    return NextResponse.json({ error: `Failed to create user: ${creationError.message}` }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  try {
    // 2. Create Smart Account & DID
    const { address: smartAccountAddress, privateKey: smartAccountPrivateKey } = await createSmartAccount();
    const hederaDID = await createHederaDID();
    await associateDIDWithSmartAccount(hederaDID, smartAccountAddress);

    // 3. Update User Record with new info
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        smart_account_address: smartAccountAddress,
        hedera_did: hederaDID,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user with smart account info:", updateError.message);
      // Even if this fails, we should still return the key to the user
    }

    // 4. Return the private key to the client
    // IMPORTANT: This is for the demo to provide a functional, non-orphaned account.
    // In production, the key should be generated and managed entirely on the client-side.
    return NextResponse.json({
      message: "User and smart account created successfully",
      smartAccountAddress,
      smartAccountPrivateKey,
      hederaDID,
    });

  } catch (error) {
    console.error("Error in post-user-creation flow:", error);
    // If this part fails, we should ideally delete the Supabase user to allow a retry
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return NextResponse.json({ error: "Failed to create smart account or DID" }, { status: 500 });
  }
}
