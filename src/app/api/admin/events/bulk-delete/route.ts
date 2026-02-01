import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/events/bulk-delete - Bulk delete events (admin only)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { eventIds } = body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: "Event IDs are required" },
        { status: 400 }
      );
    }

    // Delete all selected events
    const result = await prisma.marathonEvent.deleteMany({
      where: {
        id: {
          in: eventIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Failed to bulk delete events:", error);
    return NextResponse.json(
      { error: "Failed to delete events" },
      { status: 500 }
    );
  }
}
