import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper to convert time string to seconds
function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Helper to convert pace string (e.g., "4'00\"" or "4:00") to seconds
function paceToSeconds(pace: string): number {
  // Remove quotes and convert
  const cleaned = pace.replace(/['"]/g, "").replace("'", ":");
  const parts = cleaned.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] * 60;
}

// Initial pace group data based on the provided chart
const initialPaceGroups = [
  {
    groupNumber: 1,
    name: "1그룹",
    timeFull: timeToSeconds("2:49:00"),
    timeHalf: timeToSeconds("1:20:59"),
    time10k: timeToSeconds("0:36:40"),
    time5k: timeToSeconds("0:17:30"),
    paceFull: paceToSeconds("4:00"),
    paceHalf: paceToSeconds("3:50"),
    pace10k: paceToSeconds("3:40"),
    pace5k: paceToSeconds("3:30"),
    pace1km: paceToSeconds("3:10"),
    paceRecovery: paceToSeconds("4:25"),
  },
  {
    groupNumber: 2,
    name: "2그룹",
    timeFull: timeToSeconds("2:55:00"),
    timeHalf: timeToSeconds("1:22:41"),
    time10k: timeToSeconds("0:38:20"),
    time5k: timeToSeconds("0:18:20"),
    paceFull: paceToSeconds("4:09"),
    paceHalf: paceToSeconds("3:55"),
    pace10k: paceToSeconds("3:50"),
    pace5k: paceToSeconds("3:40"),
    pace1km: paceToSeconds("3:20"),
    paceRecovery: paceToSeconds("4:40"),
  },
  {
    groupNumber: 3,
    name: "3그룹",
    timeFull: timeToSeconds("3:00:00"),
    timeHalf: timeToSeconds("1:24:23"),
    time10k: timeToSeconds("0:39:10"),
    time5k: timeToSeconds("0:19:10"),
    paceFull: paceToSeconds("4:16"),
    paceHalf: paceToSeconds("4:00"),
    pace10k: paceToSeconds("3:55"),
    pace5k: paceToSeconds("3:50"),
    pace1km: paceToSeconds("3:30"),
    paceRecovery: paceToSeconds("4:45"),
  },
  {
    groupNumber: 4,
    name: "4그룹",
    timeFull: timeToSeconds("3:10:00"),
    timeHalf: timeToSeconds("1:31:06"),
    time10k: timeToSeconds("0:40:50"),
    time5k: timeToSeconds("0:20:00"),
    paceFull: paceToSeconds("4:30"),
    paceHalf: paceToSeconds("4:20"),
    pace10k: paceToSeconds("4:05"),
    pace5k: paceToSeconds("4:00"),
    pace1km: paceToSeconds("3:40"),
    paceRecovery: paceToSeconds("5:00"),
  },
  {
    groupNumber: 5,
    name: "5그룹",
    timeFull: timeToSeconds("3:15:00"),
    timeHalf: timeToSeconds("1:32:48"),
    time10k: timeToSeconds("0:42:30"),
    time5k: timeToSeconds("0:20:25"),
    paceFull: paceToSeconds("4:37"),
    paceHalf: paceToSeconds("4:25"),
    pace10k: paceToSeconds("4:15"),
    pace5k: paceToSeconds("4:05"),
    pace1km: paceToSeconds("3:45"),
    paceRecovery: paceToSeconds("5:05"),
  },
  {
    groupNumber: 6,
    name: "6그룹",
    timeFull: timeToSeconds("3:20:00"),
    timeHalf: timeToSeconds("1:34:29"),
    time10k: timeToSeconds("0:43:20"),
    time5k: timeToSeconds("0:20:50"),
    paceFull: paceToSeconds("4:44"),
    paceHalf: paceToSeconds("4:30"),
    pace10k: paceToSeconds("4:20"),
    pace5k: paceToSeconds("4:10"),
    pace1km: paceToSeconds("3:50"),
    paceRecovery: paceToSeconds("5:15"),
  },
  {
    groupNumber: 7,
    name: "7그룹",
    timeFull: timeToSeconds("3:30:00"),
    timeHalf: timeToSeconds("1:39:40"),
    time10k: timeToSeconds("0:45:50"),
    time5k: timeToSeconds("0:22:05"),
    paceFull: paceToSeconds("4:59"),
    paceHalf: paceToSeconds("4:45"),
    pace10k: paceToSeconds("4:35"),
    pace5k: paceToSeconds("4:25"),
    pace1km: paceToSeconds("4:05"),
    paceRecovery: paceToSeconds("5:30"),
  },
  {
    groupNumber: 8,
    name: "8그룹",
    timeFull: timeToSeconds("3:45:00"),
    timeHalf: timeToSeconds("1:48:50"),
    time10k: timeToSeconds("0:49:10"),
    time5k: timeToSeconds("0:23:20"),
    paceFull: paceToSeconds("5:20"),
    paceHalf: paceToSeconds("5:10"),
    pace10k: paceToSeconds("4:55"),
    pace5k: paceToSeconds("4:40"),
    pace1km: paceToSeconds("4:20"),
    paceRecovery: paceToSeconds("5:50"),
  },
  {
    groupNumber: 9,
    name: "9그룹",
    timeFull: timeToSeconds("4:00:00"),
    timeHalf: timeToSeconds("1:53:59"),
    time10k: timeToSeconds("0:52:30"),
    time5k: timeToSeconds("0:25:00"),
    paceFull: paceToSeconds("5:41"),
    paceHalf: paceToSeconds("5:25"),
    pace10k: paceToSeconds("5:15"),
    pace5k: paceToSeconds("5:00"),
    pace1km: paceToSeconds("4:40"),
    paceRecovery: paceToSeconds("6:10"),
  },
  {
    groupNumber: 10,
    name: "10그룹",
    timeFull: timeToSeconds("4:15:00"),
    timeHalf: timeToSeconds("2:05:50"),
    time10k: timeToSeconds("0:56:40"),
    time5k: timeToSeconds("0:27:05"),
    paceFull: paceToSeconds("6:03"),
    paceHalf: paceToSeconds("5:55"),
    pace10k: paceToSeconds("5:40"),
    pace5k: paceToSeconds("5:25"),
    pace1km: paceToSeconds("5:05"),
    paceRecovery: paceToSeconds("6:35"),
  },
];

// POST /api/pace-groups/seed - Seed initial pace group data (admin only)
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Delete existing pace groups
    await prisma.paceGroup.deleteMany();

    // Create new pace groups
    const created = await prisma.paceGroup.createMany({
      data: initialPaceGroups,
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error("Failed to seed pace groups:", error);
    return NextResponse.json(
      { error: "Failed to seed pace groups" },
      { status: 500 }
    );
  }
}
