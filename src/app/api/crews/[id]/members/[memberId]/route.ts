import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ id: string; memberId: string }>;

// DELETE /api/crews/[id]/members/[memberId] - Remove a member (owner only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id, memberId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if crew exists and user is the owner
  const crew = await prisma.crew.findUnique({ where: { id } });
  if (!crew) {
    return NextResponse.json({ error: "Crew not found" }, { status: 404 });
  }

  if (crew.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only crew owner can remove members" },
      { status: 403 }
    );
  }

  // Find the member to remove
  const member = await prisma.crewMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.crewId !== id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove the owner
  if (member.userId === crew.ownerId) {
    return NextResponse.json(
      { error: "Cannot remove the crew owner" },
      { status: 400 }
    );
  }

  await prisma.crewMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ success: true });
}
