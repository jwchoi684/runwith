import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/user/delete - Delete current user's account
export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Use transaction to delete user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete user events
      await tx.userEvent.deleteMany({ where: { userId } });

      // Delete access logs
      await tx.accessLog.deleteMany({ where: { userId } });

      // Delete running logs
      await tx.runningLog.deleteMany({ where: { userId } });

      // Delete crew memberships
      await tx.crewMember.deleteMany({ where: { userId } });

      // Delete owned crews (this will cascade delete crew members of those crews)
      await tx.crew.deleteMany({ where: { ownerId: userId } });

      // Delete sessions
      await tx.session.deleteMany({ where: { userId } });

      // Delete accounts
      await tx.account.deleteMany({ where: { userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `계정 삭제에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
