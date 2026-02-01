import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Get client IP from various headers (Render compatible)
async function getClientIP(request: NextRequest): Promise<string> {
  const headersList = await headers();

  // Render and most proxies use x-forwarded-for
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one (original client)
    const firstIP = forwardedFor.split(",")[0].trim();
    if (firstIP && firstIP !== "127.0.0.1" && firstIP !== "::1") {
      return firstIP;
    }
  }

  // Try other common headers
  const realIP = headersList.get("x-real-ip");
  if (realIP && realIP !== "127.0.0.1" && realIP !== "::1") {
    return realIP;
  }

  // Cloudflare
  const cfConnectingIP = headersList.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Render specific
  const renderIP = headersList.get("x-render-client-ip");
  if (renderIP) {
    return renderIP;
  }

  return "unknown";
}

// Fetch geolocation data from IP using ipapi.co (HTTPS, free tier)
async function getGeoLocation(ip: string): Promise<{
  country?: string;
  region?: string;
  city?: string;
} | null> {
  // Skip for localhost/private IPs
  if (
    ip === "unknown" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return null;
  }

  try {
    // Using ipapi.co (HTTPS, free 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        "User-Agent": "RunWith/1.0",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return {
          country: data.country_name,
          region: data.region,
          city: data.city,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch geolocation:", error);
  }

  // Fallback to ip-api.com (HTTP but works)
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        return {
          country: data.country,
          region: data.regionName,
          city: data.city,
        };
      }
    }
  } catch (error) {
    console.error("Fallback geolocation failed:", error);
  }

  return null;
}

// POST /api/log-access - Log user access with IP
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action = "page_view", path } = body;

  const ipAddress = await getClientIP(request);
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || undefined;

  // Get geolocation
  const geo = await getGeoLocation(ipAddress);
  const locationParts = [geo?.city, geo?.region, geo?.country].filter(Boolean);
  const locationInfo = locationParts.length > 0 ? locationParts.join(", ") : null;

  // Create access log
  await prisma.accessLog.create({
    data: {
      userId: session.user.id,
      action,
      ipAddress,
      userAgent,
      path: path || null,
      metadata: locationInfo ? { location: locationInfo } : undefined,
    },
  });

  return NextResponse.json({ success: true, ip: ipAddress, location: locationInfo });
}
