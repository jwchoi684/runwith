import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Get client IP from various headers
function getClientIP(request: NextRequest): string {
  const headersList = headers();

  // Try various headers that might contain the real IP
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headersList.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return "unknown";
}

// Fetch geolocation data from IP
async function getGeoLocation(ip: string): Promise<{
  country?: string;
  region?: string;
  city?: string;
} | null> {
  // Skip for localhost/private IPs
  if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip === "::1") {
    return null;
  }

  try {
    // Using ip-api.com (free, no API key required, 45 requests/minute limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

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
    console.error("Failed to fetch geolocation:", error);
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

  const ipAddress = getClientIP(request);
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || undefined;

  // Get geolocation
  const geo = await getGeoLocation(ipAddress);
  const locationInfo = geo ? `${geo.city || ""}, ${geo.region || ""}, ${geo.country || ""}`.replace(/^, |, $/g, "").replace(/, ,/g, ",") : null;

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
