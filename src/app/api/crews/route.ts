import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/crews - Get all crews (public) or user's crews
export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // "my" for user's crews

  if (filter === "my") {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const crews = await prisma.crew.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(crews);
  }

  // Get all public crews
  const crews = await prisma.crew.findMany({
    where: { isPublic: true },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(crews);
}

// POST /api/crews - Create a new crew
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, isPublic = true } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const crew = await prisma.crew.create({
    data: {
      name,
      description,
      isPublic,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "admin",
        },
      },
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(crew, { status: 201 });
}
