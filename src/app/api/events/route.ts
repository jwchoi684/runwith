import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/events - Get all marathon events
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const distance = searchParams.get("distance");

  const where = distance && distance !== "all"
    ? { distance: parseFloat(distance) }
    : {};

  const events = await prisma.marathonEvent.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(events);
}

// POST /api/events - Create a new marathon event (for custom events)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, location, distance, date } = body;

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
      isOfficial: false,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
