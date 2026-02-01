import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { headers } from "next/headers";

interface ApiLogData {
  userId?: string | null;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
}

// Get client IP from various headers
async function getClientIP(): Promise<string> {
  const headersList = await headers();

  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
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

  return "unknown";
}

export async function logApiCall(data: ApiLogData) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const ipAddress = await getClientIP();

    await prisma.apiLog.create({
      data: {
        userId: data.userId || null,
        method: data.method,
        path: data.path,
        statusCode: data.statusCode || null,
        duration: data.duration || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Silently fail - don't disrupt API
    console.error("Failed to log API call:", error);
  }
}

// Helper to wrap API handlers with logging
export function withApiLogging<T>(
  handler: (request: NextRequest, context?: T) => Promise<Response>
) {
  return async (request: NextRequest, context?: T): Promise<Response> => {
    const startTime = Date.now();
    const path = new URL(request.url).pathname;
    const method = request.method;

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // Log asynchronously without waiting
      logApiCall({
        method,
        path,
        statusCode: response.status,
        duration,
      }).catch(() => {});

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error case
      logApiCall({
        method,
        path,
        statusCode: 500,
        duration,
      }).catch(() => {});

      throw error;
    }
  };
}
