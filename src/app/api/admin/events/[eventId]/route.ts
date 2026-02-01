import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ eventId: string }>;

// PUT /api/admin/events/[eventId] - Update an event (admin only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { eventId } = await params;

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

  const event = await prisma.marathonEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, location, distance, courses, date, isOfficial } = body;

  const updatedEvent = await prisma.marathonEvent.update({
    where: { id: eventId },
    data: {
      name: name ?? event.name,
      location: location !== undefined ? location : event.location,
      distance: distance !== undefined ? parseFloat(distance) : event.distance,
      courses: courses !== undefined ? courses : event.courses,
      date: date !== undefined ? (date ? new Date(date) : null) : event.date,
      isOfficial: isOfficial !== undefined ? isOfficial : event.isOfficial,
    },
  });

  return NextResponse.json(updatedEvent);
}

// DELETE /api/admin/events/[eventId] - Delete an event (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { eventId } = await params;

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

  const event = await prisma.marathonEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Set eventId to null for all running logs that reference this event
  await prisma.runningLog.updateMany({
    where: { eventId },
    data: { eventId: null },
  });

  await prisma.marathonEvent.delete({
    where: { id: eventId },
  });

  return NextResponse.json({ success: true });
}
