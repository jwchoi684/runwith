import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      pbFull: true,
      pbHalf: true,
      pb10k: true,
      isPublicProfile: true,
      isPublicRecords: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, pbFull, pbHalf, pb10k, isPublicProfile, isPublicRecords } = body;

    // Build update data object dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Update name if provided
    if (name !== undefined) {
      if (typeof name !== "string") {
        return NextResponse.json(
          { error: "Name must be a string" },
          { status: 400 }
        );
      }
      const trimmedName = name.trim();
      if (trimmedName.length < 1 || trimmedName.length > 50) {
        return NextResponse.json(
          { error: "Name must be between 1 and 50 characters" },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    // Validate personal best times (must be positive integers or null)
    const validatePB = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      const num = Number(value);
      if (!Number.isInteger(num) || num <= 0) return null;
      return num;
    };

    if (pbFull !== undefined) updateData.pbFull = validatePB(pbFull);
    if (pbHalf !== undefined) updateData.pbHalf = validatePB(pbHalf);
    if (pb10k !== undefined) updateData.pb10k = validatePB(pb10k);

    // Update privacy settings if provided
    if (typeof isPublicProfile === "boolean") {
      updateData.isPublicProfile = isPublicProfile;
    }
    if (typeof isPublicRecords === "boolean") {
      updateData.isPublicRecords = isPublicRecords;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        pbFull: true,
        pbHalf: true,
        pb10k: true,
        isPublicProfile: true,
        isPublicRecords: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
