import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require authentication
const protectedRoutes = [
  "/profile",
  "/records/new",
  "/crews/new",
  "/admin",
];

// Routes that are public (don't need authentication)
const publicRoutes = [
  "/login",
  "/onboarding",
  "/events",
  "/leaderboard",
  "/pace-chart",
  "/crews",
];

export async function middleware(request: NextRequest, event: NextFetchEvent) {
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
  // Skip for API routes, static files, and public routes
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

  // Check if route is explicitly public
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  ) || path === "/";

  if (isProtectedRoute) {
    // Get session for protected routes
    const session = await auth();

    // If no session or invalid session, redirect to login
    if (!session?.user?.id) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Additional check for admin routes
    if (path.startsWith("/admin") && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
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
    // Home page (for session check)
    "/",
  ],
};
