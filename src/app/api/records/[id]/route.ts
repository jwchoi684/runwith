import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

// GET /api/records/[id] - Get a single record
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.runningLog.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

// PUT /api/records/[id] - Update a record
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.runningLog.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, distance, duration, notes, weather, feeling } = body;

  // Parse distance with 3 decimal precision
  const distanceValue = Math.round(parseFloat(distance) * 1000) / 1000;

  // Calculate pace
  const pace = duration > 0 && distanceValue > 0 ? duration / 60 / distanceValue : null;

  const record = await prisma.runningLog.update({
    where: { id },
    data: {
      date: new Date(date),
      distance: distanceValue,
      duration: parseInt(duration),
      pace,
      notes,
      weather,
      feeling: feeling ? parseInt(feeling) : null,
    },
  });

  return NextResponse.json(record);
}

// DELETE /api/records/[id] - Delete a record
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.runningLog.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.runningLog.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
