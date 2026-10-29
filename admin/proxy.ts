import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The backend names the cookie `awtomatig.session_token`, with a `__Secure-` prefix over HTTPS.
const SESSION_COOKIES = ["awtomatig.session_token", "__Secure-awtomatig.session_token"];

/**
 * Optimistic check only: no session cookie means no point rendering a page, so send the visitor to /login and remember where
 * they were going. It does not prove the session is valid. `requireSession()` (layouts) and the backend (every API call) do.
 */
export function proxy(request: NextRequest) {
  if (SESSION_COOKIES.some((name) => request.cookies.has(name))) return NextResponse.next();

  const url = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the sign-in screen, the API rewrite, Next.js internals and static files.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|images/).*)"],
};
