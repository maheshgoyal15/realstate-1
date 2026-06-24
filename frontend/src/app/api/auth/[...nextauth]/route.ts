import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
  providers: [
    // TODO(security): Consider using OAuth providers (Google, Apple) for production SSO integration.
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
