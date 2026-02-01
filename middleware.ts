import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;

  // Skip logging for non-API routes, static files, and specific endpoints
  if (
    !path.startsWith("/api") ||
    path === "/api/log-api" ||
    path === "/api/log-access" ||
    path.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Get client info from headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  // Render uses x-forwarded-for
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

export const config = {
  matcher: "/api/:path*",
};
