import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/records - Get all records for the current user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.runningLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

// POST /api/records - Create a new record
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, distance, duration, notes, weather, feeling } = body;

  // Calculate pace (minutes per km)
  const pace = duration > 0 && distance > 0 ? duration / 60 / distance : null;

  const record = await prisma.runningLog.create({
    data: {
      userId: session.user.id,
      date: new Date(date),
      distance: parseFloat(distance),
      duration: parseInt(duration),
      pace,
      notes,
      weather,
      feeling: feeling ? parseInt(feeling) : null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
