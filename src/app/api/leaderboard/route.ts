import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const crewId = searchParams.get("crew") || "all";
  const distance = searchParams.get("distance") || "all";
  const time = searchParams.get("time") || "all";

  // Build date filter
  let dateFilter: Date | undefined;
  const now = new Date();

  switch (time) {
    case "week":
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      dateFilter = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      dateFilter = undefined;
  }

  // Build distance filter
  let minDistance: number | undefined;
  let maxDistance: number | undefined;

  switch (distance) {
    case "5":
      minDistance = 4;
      maxDistance = 6;
      break;
    case "10":
      minDistance = 9;
      maxDistance = 12;
      break;
    case "21":
      minDistance = 20;
      maxDistance = 23;
      break;
    case "42":
      minDistance = 40;
      maxDistance = 45;
      break;
    default:
      minDistance = undefined;
      maxDistance = undefined;
  }

  // Get user IDs to filter by (if crew is selected)
  let userIds: string[] | undefined;

  if (crewId !== "all") {
    const crewMembers = await prisma.crewMember.findMany({
      where: { crewId },
      select: { userId: true },
    });
    userIds = crewMembers.map((m) => m.userId);
  }

  // Build where clause
  const whereClause: {
    userId?: { in: string[] };
    date?: { gte: Date };
    distance?: { gte?: number; lte?: number };
  } = {};

  if (userIds) {
    whereClause.userId = { in: userIds };
  }

  if (dateFilter) {
    whereClause.date = { gte: dateFilter };
  }

  if (minDistance !== undefined && maxDistance !== undefined) {
    whereClause.distance = { gte: minDistance, lte: maxDistance };
  }

  // Get aggregated stats per user
  const stats = await prisma.runningLog.groupBy({
    by: ["userId"],
    where: whereClause,
    _sum: { distance: true },
    _count: { id: true },
    _min: { pace: true },
  });

  // Get user details
  const userIdsList = stats.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIdsList } },
    select: { id: true, name: true, image: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Combine and sort
  const leaderboard = stats
    .map((stat) => {
      const user = userMap.get(stat.userId);
      return {
        userId: stat.userId,
        userName: user?.name || null,
        userImage: user?.image || null,
        totalDistance: stat._sum.distance || 0,
        totalRuns: stat._count.id,
        bestPace: stat._min.pace || null,
      };
    })
    .sort((a, b) => b.totalDistance - a.totalDistance);

  return NextResponse.json(leaderboard);
}
