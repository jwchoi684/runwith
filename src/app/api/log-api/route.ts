import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/log-api - Log API call (internal use only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, path, statusCode, duration, userId, ipAddress, userAgent } = body;

    // Skip logging for the log-api endpoint itself and static files
    if (path === "/api/log-api" || path.startsWith("/_next")) {
      return NextResponse.json({ success: true });
    }

    await prisma.apiLog.create({
      data: {
        userId: userId || null,
        method: method || "GET",
        path: path || "/",
        statusCode: statusCode || null,
        duration: duration || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log API call:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
