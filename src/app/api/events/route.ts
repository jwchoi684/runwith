import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/events - Get marathon events (public)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const distance = searchParams.get("distance");
  const upcoming = searchParams.get("upcoming"); // 오늘 이후 대회만

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (distance && distance !== "all") {
    where.distance = parseFloat(distance);
  }

  // 오늘 이후 대회만 필터링 (서버에서 처리)
  if (upcoming === "true") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.date = { gte: today };
  }

  const events = await prisma.marathonEvent.findMany({
    where,
    orderBy: upcoming === "true" ? { date: "asc" } : { name: "asc" },
    // upcoming인 경우 올해만 가져오기
    ...(upcoming === "true" && {
      take: 100, // 최대 100개로 제한
    }),
  });

  // Cache-Control 헤더 추가 (5분간 캐시)
  return NextResponse.json(events, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

// POST /api/events - Create a new marathon event (for custom events)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, location, distance, date } = body;

  if (!name || !distance) {
    return NextResponse.json(
      { error: "Name and distance are required" },
      { status: 400 }
    );
  }

  const event = await prisma.marathonEvent.create({
    data: {
      name,
      location: location || null,
      distance: parseFloat(distance),
      date: date ? new Date(date) : null,
      isOfficial: false,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
