import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      // Must match the __Host- prefixed cookie name configured in
      // app/api/auth/[...nextauth]/route.ts, otherwise withAuth's getToken()
      // looks for the default __Secure- cookie, never finds a session, and
      // redirect-loops back to /login.
      name: "__Host-next-auth.session-token",
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analyze/:path*",
    "/reports/:path*",
    "/contractors/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
