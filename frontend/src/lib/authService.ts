import { signOut } from "next-auth/react";

// Mandatory Secure Web Skills: Sensitive Data Storage & Session Lifecycle
// - MUST NOT store sensitive authentication tokens in localStorage or sessionStorage
// - MUST clear client-side state on logout
// - MUST trigger full page reload or redirect to clear cache on logout

export class AuthService {
  private inMemoryToken: string | null = null;

  public setToken(token: string) {
    // Stored strictly in memory, never in localStorage/sessionStorage
    this.inMemoryToken = token;
  }

  public getToken(): string | null {
    return this.inMemoryToken;
  }

  public clearSession() {
    this.inMemoryToken = null;
  }
}

export const authService = new AuthService();

export async function handleLogout() {
  // Clear memory state
  authService.clearSession();
  
  // Invalidate server-side session cookies via NextAuth signOut, redirecting to /login to force clean state
  await signOut({ redirect: true, callbackUrl: "/login" });
  
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
