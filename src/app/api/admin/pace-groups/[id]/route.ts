import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

// PUT /api/admin/pace-groups/[id] - Update a pace group (admin only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

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

    const paceGroup = await prisma.paceGroup.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(paceGroup);
  } catch (error) {
    console.error("Failed to update pace group:", error);
    return NextResponse.json(
      { error: "Failed to update pace group" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pace-groups/[id] - Delete a pace group (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

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
    await prisma.paceGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete pace group:", error);
    return NextResponse.json(
      { error: "Failed to delete pace group" },
      { status: 500 }
    );
  }
}
