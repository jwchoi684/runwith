import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ userId: string }>;

// PUT /api/admin/users/[userId]/role - Update user role (admin only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
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

  const body = await request.json();
  const { role } = body;

  if (!role || !["user", "admin"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be 'user' or 'admin'" },
      { status: 400 }
    );
  }

  // Find the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update the user's role
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json({ success: true, role });
}
