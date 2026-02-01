import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Skip logging for non-API routes, static files, and the log-api endpoint itself
  if (
    !path.startsWith("/api") ||
    path === "/api/log-api" ||
    path.startsWith("/api/auth") // Skip auth routes to avoid loops
  ) {
    return NextResponse.next();
  }

  // Get client info
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIP || cfConnectingIP || "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;

  // Process the request
  const response = NextResponse.next();

  // Log API call asynchronously (fire and forget)
  const duration = Date.now() - startTime;

  // Use fetch to log (async, non-blocking)
  const baseUrl = request.nextUrl.origin;
  fetch(`${baseUrl}/api/log-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method,
      path,
      statusCode: response.status,
      duration,
      ipAddress,
      userAgent,
    }),
  }).catch(() => {
    // Silently fail - don't disrupt the request
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
