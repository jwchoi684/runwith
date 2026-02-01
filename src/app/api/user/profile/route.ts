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
    const { name, pbFull, pbHalf, pb10k } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
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

    // Validate personal best times (must be positive integers or null)
    const validatePB = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      const num = Number(value);
      if (!Number.isInteger(num) || num <= 0) return null;
      return num;
    };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: trimmedName,
        pbFull: validatePB(pbFull),
        pbHalf: validatePB(pbHalf),
        pb10k: validatePB(pb10k),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        pbFull: true,
        pbHalf: true,
        pb10k: true,
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
