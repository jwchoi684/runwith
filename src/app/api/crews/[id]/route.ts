import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

// GET /api/crews/[id] - Get a single crew with members
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const crew = await prisma.crew.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!crew) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(crew);
}

// PUT /api/crews/[id] - Update a crew (owner only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.crew.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, isPublic } = body;

  const crew = await prisma.crew.update({
    where: { id },
    data: {
      name,
      description,
      isPublic,
    },
  });

  return NextResponse.json(crew);
}

// DELETE /api/crews/[id] - Delete a crew (owner only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.crew.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
  }

  await prisma.crew.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
