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

      // Check if a profile already exists for this user.
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

      // If no profile exists, this is a new OAuth user. Create a profile for them.
      if (!profile) {

        // Create an admin client to insert into the profiles table
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Extract user's full name from the provider's data
        const fullName = user.user_metadata.full_name || '';
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: user.id,
                role: 'user', // Assign default 'user' role
                first_name: firstName || '',
                last_name: lastName || ' ',
            });

        if (insertError) {
          console.error('Error creating profile for OAuth user:', insertError.message);
          // Redirect to an error page, as the user might not have a proper profile
          return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Could not create profile.`);
        }
      }

      // Redirect to the intended page after successful login/signup
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to an error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}