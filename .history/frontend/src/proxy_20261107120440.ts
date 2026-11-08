import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

/**
 * Optimistic routing only: redirects to /login when no session cookie is present.
 * The cookie is not validated here (it may be expired), so auth pages are never
 * redirected away from — that would loop with an invalid cookie. Real session
 * validation happens in the API and in DashboardShell.
 */
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
