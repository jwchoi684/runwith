import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/pace-groups - Get all pace groups (admin only)
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const paceGroups = await prisma.paceGroup.findMany({
      orderBy: { groupNumber: "asc" },
    });

    return NextResponse.json(paceGroups);
  } catch (error) {
    console.error("Failed to fetch pace groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch pace groups" },
      { status: 500 }
    );
  }
}

// POST /api/admin/pace-groups - Create a new pace group (admin only)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const paceGroup = await prisma.paceGroup.create({
      data: body,
    });

    return NextResponse.json(paceGroup);
  } catch (error) {
    console.error("Failed to create pace group:", error);
    return NextResponse.json(
      { error: "Failed to create pace group" },
      { status: 500 }
    );
  }
}
