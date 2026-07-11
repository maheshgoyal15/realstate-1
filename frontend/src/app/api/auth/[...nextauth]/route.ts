import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Mandatory Secure Web Skills: Multi-tiered Secret Resolution (Node.js)
// Resolution: Environment -> Local File Query -> Random Gen + Log
const getNextAuthSecret = (): string => {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET;
  }
  try {
    const fs = require('fs');
    if (fs.existsSync('./jwt_secret.txt')) {
      return fs.readFileSync('./jwt_secret.txt', 'utf-8').trim();
    }
  } catch (err) {
    // Ignore fs errors in edge runtimes
  }
  console.warn("Generating ephemeral secret. Instance-isolated!");
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // Short inactivity timeout (30 minutes)
  },
  // Mandatory Secure Web Skills: Secure Cookie Management
  // When provisioning client credentials via http cookies, MUST harden the cookies:
  // Name starts with '__Host-'. SameSite=Lax, Secure and HttpOnly flags.
  cookies: {
    sessionToken: {
      name: `__Host-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `__Host-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Mandatory Secure Web Skills: BFF Pattern
        // Next.js acts as the secure Backend-for-Frontend (BFF) proxy to the FastAPI backend running on 127.0.0.1
        try {
          const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const user = await res.json();

          if (res.ok && user) {
            return user;
          }
        } catch (error) {
          console.error("BFF Authentication Error:", error);
          return null;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!account.id_token) {
          return false;
        }
        try {
          // Mandatory Secure Web Skills: BFF Pattern
          // Exchange the Google ID token for a backend-issued JWT so every
          // authenticated request (regardless of login method) carries the
          // same kind of access token. The backend independently re-verifies
          // the Google token signature - this route is reachable directly
          // (via the /api/v1 rewrite), so it cannot be trusted on its own.
          const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${backendUrl}/api/v1/auth/oauth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error(`Google OAuth backend exchange failed (${res.status}):`, errText);
            return false;
          }

          const backendUser = await res.json();
          (user as any).id = backendUser.id;
          (user as any).role = backendUser.role;
          (user as any).accessToken = backendUser.accessToken;
          return true;
        } catch (error) {
          console.error("Google OAuth backend exchange error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
