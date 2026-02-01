import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/events - Create a new event (admin only)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if current user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, location, distance, date, isOfficial } = body;

  if (!name || !distance) {
    return NextResponse.json(
      { error: "Name and distance are required" },
      { status: 400 }
    );
  }

  const event = await prisma.marathonEvent.create({
    data: {
      name,
      location: location || null,
      distance: parseFloat(distance),
      date: date ? new Date(date) : null,
      isOfficial: isOfficial ?? true,
    },
  });

  return NextResponse.json(event);
}
