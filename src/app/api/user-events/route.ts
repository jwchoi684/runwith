import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/user-events - Get user's registered events
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEvents = await prisma.userEvent.findMany({
    where: { userId: session.user.id },
    include: {
      event: true,
    },
    orderBy: {
      event: {
        date: "asc",
      },
    },
  });

  return NextResponse.json(userEvents);
}

// POST /api/user-events - Register for an event
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId, course } = body;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  // Check if event exists
  const event = await prisma.marathonEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check if already registered
  const existing = await prisma.userEvent.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already registered" }, { status: 400 });
  }

  const userEvent = await prisma.userEvent.create({
    data: {
      userId: session.user.id,
      eventId,
      course: course || null,
    },
    include: {
      event: true,
    },
  });

  return NextResponse.json(userEvent);
}
