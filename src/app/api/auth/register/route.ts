import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, firstName, lastName, phone, role, businessName, businessRegNumber } = await request.json()

  // Validate required fields
  if (!email || !password || !role || !firstName || !lastName) {
    return NextResponse.json({ error: 'Email, password, first name, last name, and role are required.' }, { status: 400 })
  }

  // Use the Supabase Admin client to securely perform this operation
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Create the user in Supabase Auth
  const { data: { user }, error: creationError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Send a confirmation email for security
  })

  if (creationError) {
    console.error('Supabase user creation error:', creationError.message)
    return NextResponse.json({ error: `Failed to create user: ${creationError.message}` }, { status: 400 })
  }

  if (!user) {
    console.error('User not created, but no error was thrown.')
    return NextResponse.json({ error: 'Failed to create user for an unknown reason.' }, { status: 500 })
  }

  // 2. Manually insert the new profile into the public.profiles table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      role,
      first_name: firstName,
      last_name: lastName,
      phone: phone
    })

  if (profileError) {
      // If profile insert fails, we should ideally delete the auth user to avoid orphans.
      console.error(`Failed to create profile for user ${user.id}:`, profileError.message)
      return NextResponse.json({ error: `User account created, but failed to create profile: ${profileError.message}` }, { status: 500 })
  }

  // 3. If the user is a merchant, create their merchant record.
  if (role === 'merchant') {
    if (!businessName) {
        return NextResponse.json({ error: 'Business name is required for merchant registration.' }, { status: 400 })
    }
    const { error: merchantError } = await supabaseAdmin
      .from('merchants')
      .insert({
        id: user.id, // Link to the user's profile ID
        business_name: businessName,
        business_registration_number: businessRegNumber,
      })

    if (merchantError) {
      // This is a critical failure. The user exists but is not a merchant.
      // A more robust solution might delete the user to allow them to try again.
      console.error(`Failed to create merchant record for user ${user.id}:`, merchantError.message)
      return NextResponse.json({ error: `User account created, but failed to create merchant record: ${merchantError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Registration successful! Please check your email for verification.' }, { status: 200 })
}