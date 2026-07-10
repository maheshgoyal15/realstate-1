import { getSession } from "next-auth/react";

// Backend calls MUST go through the relative `/api/v1/...` path so they're
// proxied server-side via the rewrite in next.config.mjs. A hardcoded
// `127.0.0.1:8000` fetch only ever works when the browser and the backend
// happen to share a machine - it breaks in any real deployment - and it also
// skips attaching the session's access token, which the backend now requires.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getSession();
  const accessToken = (session?.user as any)?.accessToken;

  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}
