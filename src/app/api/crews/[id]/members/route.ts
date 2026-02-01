import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

// POST /api/crews/[id]/members - Join a crew
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if crew exists
  const crew = await prisma.crew.findUnique({ where: { id } });
  if (!crew) {
    return NextResponse.json({ error: "Crew not found" }, { status: 404 });
  }

  // Verify password if set
  if (crew.password) {
    try {
      const body = await request.json();
      const { password } = body;

      if (!password || password !== crew.password) {
        return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "비밀번호가 필요합니다" }, { status: 403 });
    }
  }

  // Check if already a member
  const existingMember = await prisma.crewMember.findUnique({
    where: {
      userId_crewId: {
        userId: session.user.id,
        crewId: id,
      },
    },
  });

  if (existingMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  // Join the crew
  const member = await prisma.crewMember.create({
    data: {
      userId: session.user.id,
      crewId: id,
      role: "member",
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}

// DELETE /api/crews/[id]/members - Leave a crew
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if crew exists and user is not the owner
  const crew = await prisma.crew.findUnique({ where: { id } });
  if (!crew) {
    return NextResponse.json({ error: "Crew not found" }, { status: 404 });
  }

  if (crew.ownerId === session.user.id) {
    return NextResponse.json(
      { error: "Owner cannot leave. Delete the crew instead." },
      { status: 400 }
    );
  }

  // Check if member
  const member = await prisma.crewMember.findUnique({
    where: {
      userId_crewId: {
        userId: session.user.id,
        crewId: id,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 400 });
  }

  await prisma.crewMember.delete({
    where: { id: member.id },
  });

  return NextResponse.json({ success: true });
}
