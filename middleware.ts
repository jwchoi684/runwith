import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  // Log API call asynchronously using internal fetch
  // Use absolute URL for Edge runtime
  try {
    const baseUrl = request.nextUrl.origin;
    // Fire and forget - don't await
    fetch(`${baseUrl}/api/log-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass the original client info
        "x-original-ip": ipAddress,
        "x-original-ua": userAgent,
      },
      body: JSON.stringify({
        method,
        path,
        ipAddress,
        userAgent,
      }),
    }).catch(() => {
      // Silently fail
    });
  } catch {
    // Silently fail
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
