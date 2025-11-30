import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { AuthOptions } from "next-auth";
import { SiweMessage } from "siwe";
import { getCsrfToken } from "next-auth/react";

export const getAuthOptions = (): AuthOptions => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      CredentialsProvider({
        id: "siwe",
        name: "Ethereum",
        credentials: {
          message: { label: "Message", type: "text" },
          signature: { label: "Signature", type: "text" },
        },
        async authorize(credentials, req) {
          try {
            const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"));

            // This is a workaround for NextAuth.js not providing the request object
            // in the authorize function. We need the CSRF token for SIWE verification.
            // It's not the most elegant solution, but it's a common pattern for SIWE + NextAuth.
            const nonce = await getCsrfToken({ req: { headers: req.headers } });

            const result = await siwe.verify({
              signature: credentials?.signature || "",
              nonce,
            });

            if (result.success) {
              const { address } = siwe;

              // Check if user exists in the 'profiles' table
              let { data: user, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('wallet_address', address)
                .single();

              if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
                console.error("Error fetching user by wallet address:", error);
                return null;
              }

              if (user) {
                // Return a plain object for the session, not the full Supabase user object
                return { id: user.id, email: user.email, walletAddress: user.wallet_address };
              }

              // If user doesn't exist, create a new auth user and a profile
              const { data: newUser, error: creationError } = await supabaseAdmin.auth.admin.createUser({
                // Supabase doesn't require email for wallet-based sign-up,
                // but we can create a placeholder.
                email: `${address}@kelo.com`,
                user_metadata: {
                  wallet_address: address,
                  role: 'user', // Default role for SIWE sign-up
                },
              });

              if (creationError) {
                console.error("Failed to create user for SIWE:", creationError.message);
                return null;
              }
              if (!newUser) return null;

              // The database trigger 'handle_new_user' should create the profile.
              // We'll return the new user's ID and let the session callback handle the rest.
              return { id: newUser.user.id, email: newUser.user.email, walletAddress: address };
            }
            return null;
          } catch (e) {
            console.error("SIWE authorization error:", e);
            return null;
          }
        },
      }),
      CredentialsProvider({
        name: "Credentials",
        credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
        phone: { label: "Phone", type: "text" },
        businessName: { label: "Business Name", type: "text" },
        businessRegNumber: { label: "Business Registration Number", type: "text" },
        isRegister: { label: "Is Register", type: "text" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Handle Registration
        if (credentials.isRegister === 'true') {
          const role = credentials.role || 'user'; // Default to 'user'

          const { data: { user }, error: creationError } = await supabaseAdmin.auth.admin.createUser({
            email: credentials.email,
            password: credentials.password,
            email_confirm: true,
            user_metadata: {
              first_name: credentials.firstName,
              last_name: credentials.lastName,
              phone: credentials.phone,
              role: role,
            },
          });

          if (creationError) {
            console.error('Supabase user creation error:', creationError.message);
            throw new Error(`Failed to create user: ${creationError.message}`);
          }

          if (!user) {
            return null;
          }

          // If the user is a merchant, create their merchant record.
          if (role === 'merchant') {
            if (!credentials.businessName) {
              throw new Error('Business name is required for merchant registration.');
            }
            const { error: merchantError } = await supabaseAdmin
              .from('merchants')
              .insert({
                id: user.id,
                business_name: credentials.businessName,
                business_registration_number: credentials.businessRegNumber,
              });

            if (merchantError) {
              console.error(`Failed to create merchant record for user ${user.id}:`, merchantError.message);
              // Attempt to delete the user to allow them to try again, preventing orphaned users
              await supabaseAdmin.auth.admin.deleteUser(user.id);
              throw new Error(`User account created, but failed to create merchant record. Please try again.`);
            }
          }

          return {
            id: user.id,
            email: user.email,
          };
        }

        // Handle Login
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          console.error("Supabase login error:", error.message);
          return null;
        }
        if (!data.user) {
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email,
        };
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.sub = user.id;

        // On sign-in (or new user creation), fetch the role from the Supabase 'profiles' table.
        const { data: profileData, error } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileData) {
          token.role = profileData.role;
        } else if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user role for JWT:", error.message);
        } else {
          // Fallback role if profile is not found (e.g., still being created by a trigger)
          token.role = 'user';
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // After a sign-in, redirect to the dashboard.
      // This handles both credentials and OAuth providers.
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + '/dashboard'
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.MOCK_AUTH === 'true' ? process.env.MOCK_AUTH_SECRET : process.env.NEXTAUTH_SECRET,
  };
};