import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/profile",
  "/records/new",
  "/crews/new",
  "/admin",
];

// Session cookie names for next-auth
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;

  // ===== API Logging (for non-auth API routes) =====
  if (
    path.startsWith("/api") &&
    path !== "/api/log-api" &&
    path !== "/api/log-access" &&
    !path.startsWith("/api/auth")
  ) {
    // Get client info from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIP || cfConnectingIP || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const method = request.method;

    // Clone the request to add timing header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-start", Date.now().toString());

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Log API call using waitUntil to ensure completion
    const baseUrl = request.nextUrl.origin;

    event.waitUntil(
      fetch(`${baseUrl}/api/log-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-original-ip": ipAddress,
          "x-original-ua": userAgent,
        },
        body: JSON.stringify({
          method,
          path,
          ipAddress,
          userAgent,
        }),
      }).catch((error) => {
        console.error("Failed to log API call:", error);
      })
    );

    return response;
  }

  // ===== Route Protection =====
  // Skip for API routes, static files
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    // Check for session cookie (Edge-compatible check)
    const hasSessionCookie = SESSION_COOKIE_NAMES.some(
      (name) => request.cookies.has(name)
    );

    // If no session cookie, redirect to login
    if (!hasSessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Full session validation (including user existence check and admin role check)
    // is done in the page/API route itself, not in middleware
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes
    "/api/:path*",
    // Protected routes
    "/profile/:path*",
    "/records/new",
    "/crews/new",
    "/admin/:path*",
  ],
};
