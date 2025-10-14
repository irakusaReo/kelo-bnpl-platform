import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { AuthOptions } from "next-auth";
import { SiweMessage } from "siwe";

export const getAuthOptions = (): AuthOptions => {
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
        async authorize(credentials) {
          try {
            const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"));

            const result = await siwe.verify({
              signature: credentials?.signature || "",
              nonce: await getCsrfToken({ req: { headers: req.headers } }),
            });

            if (result.success) {
              const { address } = siwe;

              const user = await prisma.user.findUnique({
                where: { walletAddress: address },
              });

              if (user) {
                return user;
              }

              const newUser = await prisma.user.create({
                data: {
                  walletAddress: address,
                },
              });

              return newUser;
            }
            return null;
          } catch (e) {
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
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
  }
};