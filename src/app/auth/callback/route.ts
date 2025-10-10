import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error: sessionError, data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (!sessionError && session) {
      const user = session.user;

      // Check if the user is new (i.e., doesn't have a role assigned yet)
      // This is a simple way to check for first-time OAuth logins.
      if (!user.app_metadata.role) {

        // Create an admin client to update the user's metadata
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Extract user's full name from the provider's data
        const fullName = user.user_metadata.full_name || '';
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            app_metadata: {
              ...user.app_metadata,
              role: 'user', // Assign default 'user' role
              first_name: firstName || '',
              last_name: lastName || ' '
            }
          }
        )

        if (updateError) {
          console.error('Error updating user metadata for OAuth user:', updateError.message);
          // Redirect to an error page, as the user might not have a proper profile
          return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Could not assign role.`);
        }
      }

      // Redirect to the intended page after successful login/signup
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to an error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}