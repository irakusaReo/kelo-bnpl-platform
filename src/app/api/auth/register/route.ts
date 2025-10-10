import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, firstName, lastName, phone, role, businessName, businessRegNumber } = await request.json()

  // Create a Supabase client with the service role key to perform admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Create the user in Supabase Auth
  const { data: { user }, error: creationError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Set to true to send a confirmation email
    app_metadata: {
      role: role,
      // Pass other details here so the trigger can use them if needed,
      // and for a complete record in auth.users
      first_name: firstName,
      last_name: lastName,
      phone: phone
    }
  })

  if (creationError) {
    console.error('Supabase user creation error:', creationError.message)
    return NextResponse.json({ error: `Failed to create user: ${creationError.message}` }, { status: 400 })
  }

  if (!user) {
    console.error('User not created, but no error was thrown.')
    return NextResponse.json({ error: 'Failed to create user for an unknown reason.' }, { status: 500 })
  }

  // The `handle_new_user` trigger will automatically create a profile.
  // We just need to update it with the additional information.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone
    })
    .eq('id', user.id)

  if (profileError) {
      // If profile update fails, we should ideally delete the auth user to avoid orphans.
      // For now, we'll log the error and inform the client.
      console.error(`Failed to update profile for user ${user.id}:`, profileError.message)
      return NextResponse.json({ error: `User created, but failed to save profile: ${profileError.message}` }, { status: 500 })
  }

  // 2. If the user is a merchant, create an entry in the merchants table
  if (role === 'merchant') {
    const { error: merchantError } = await supabaseAdmin
      .from('merchants')
      .insert({
        id: user.id, // Link to the user's profile ID
        business_name: businessName,
        business_registration_number: businessRegNumber,
      })

    if (merchantError) {
      // This is a critical failure. We have an auth user and a profile, but no merchant record.
      console.error(`Failed to create merchant record for user ${user.id}:`, merchantError.message)
      return NextResponse.json({ error: `User created, but failed to create merchant record: ${merchantError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'User registered successfully. Please check your email for verification.' }, { status: 200 })
}