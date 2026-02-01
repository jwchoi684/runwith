import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ userId: string }>;

// DELETE /api/admin/users/[userId] - Delete a user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { userId } = await params;

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

  // Prevent self-deletion
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedCrews: true,
        _count: {
          select: {
            runningLogs: true,
            crews: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transfer ownership of any owned crews to another admin or delete them
    for (const crew of userToDelete.ownedCrews) {
      // Find another member to transfer ownership to
      const otherMember = await prisma.crewMember.findFirst({
        where: {
          crewId: crew.id,
          userId: { not: userId },
        },
        orderBy: {
          joinedAt: "asc",
        },
      });

      if (otherMember) {
        // Transfer ownership
        await prisma.$transaction([
          prisma.crew.update({
            where: { id: crew.id },
            data: { ownerId: otherMember.userId },
          }),
          prisma.crewMember.update({
            where: { id: otherMember.id },
            data: { role: "owner" },
          }),
        ]);
      } else {
        // No other members, delete the crew
        await prisma.crew.delete({
          where: { id: crew.id },
        });
      }
    }

    // Delete crew memberships
    await prisma.crewMember.deleteMany({
      where: { userId },
    });

    // Delete running logs
    await prisma.runningLog.deleteMany({
      where: { userId },
    });

    // Delete sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete accounts
    await prisma.account.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      deletedRecords: userToDelete._count.runningLogs,
      deletedMemberships: userToDelete._count.crews,
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
