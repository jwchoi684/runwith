import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/user-events/[eventId] - Remove event registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const userEvent = await prisma.userEvent.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId,
      },
    },
  });

  if (!userEvent) {
    return NextResponse.json({ error: "Not registered" }, { status: 404 });
  }

  await prisma.userEvent.delete({
    where: { id: userEvent.id },
  });

  return NextResponse.json({ success: true });
}
