import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/pace-groups - Get all pace groups
export async function GET() {
  try {
    const paceGroups = await prisma.paceGroup.findMany({
      orderBy: { groupNumber: "asc" },
    });

    return NextResponse.json(paceGroups);
  } catch (error) {
    console.error("Failed to fetch pace groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch pace groups" },
      { status: 500 }
    );
  }
}
