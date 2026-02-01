import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/log-api - Log API call (internal use only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, path, ipAddress, userAgent } = body;

    // Skip logging for the log-api endpoint itself and static files
    if (!path || path === "/api/log-api" || path.startsWith("/_next")) {
      return NextResponse.json({ success: true });
    }

    // Get IP from header or body
    const ip = request.headers.get("x-original-ip") || ipAddress || "unknown";
    const ua = request.headers.get("x-original-ua") || userAgent || "";

    await prisma.apiLog.create({
      data: {
        userId: null,
        method: method || "GET",
        path: path,
        statusCode: null,
        duration: null,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log API call:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
