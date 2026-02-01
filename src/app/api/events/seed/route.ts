import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const koreanMarathonEvents = [
  // 풀마라톤 (42.195km)
  { name: "서울국제마라톤", location: "서울", distance: 42.195 },
  { name: "동아마라톤", location: "서울", distance: 42.195 },
  { name: "춘천마라톤", location: "춘천", distance: 42.195 },
  { name: "경주국제마라톤", location: "경주", distance: 42.195 },
  { name: "대구국제마라톤", location: "대구", distance: 42.195 },
  { name: "부산마라톤", location: "부산", distance: 42.195 },
  { name: "제주국제마라톤", location: "제주", distance: 42.195 },
  { name: "충주마라톤", location: "충주", distance: 42.195 },
  { name: "공주마라톤", location: "공주", distance: 42.195 },
  { name: "군산새만금마라톤", location: "군산", distance: 42.195 },

  // 하프마라톤 (21.0975km)
  { name: "서울하프마라톤", location: "서울", distance: 21.0975 },
  { name: "JTBC 서울마라톤 (하프)", location: "서울", distance: 21.0975 },
  { name: "인천하프마라톤", location: "인천", distance: 21.0975 },
  { name: "수원하프마라톤", location: "수원", distance: 21.0975 },
  { name: "대전하프마라톤", location: "대전", distance: 21.0975 },
  { name: "광주하프마라톤", location: "광주", distance: 21.0975 },
  { name: "청주하프마라톤", location: "청주", distance: 21.0975 },
  { name: "여의도벚꽃마라톤", location: "서울", distance: 21.0975 },

  // 10K
  { name: "나이키 우먼스 10K", location: "서울", distance: 10 },
  { name: "한강10K", location: "서울", distance: 10 },
  { name: "잠실10K", location: "서울", distance: 10 },
  { name: "올림픽공원10K", location: "서울", distance: 10 },
  { name: "판교10K", location: "성남", distance: 10 },

  // 5K
  { name: "서울 5K 런", location: "서울", distance: 5 },
  { name: "한강 5K", location: "서울", distance: 5 },
  { name: "컬러런 5K", location: "서울", distance: 5 },
];

// POST /api/events/seed - Seed marathon events
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if events already exist
  const existingCount = await prisma.marathonEvent.count();
  if (existingCount > 0) {
    return NextResponse.json({
      message: "Events already seeded",
      count: existingCount
    });
  }

  // Seed events
  const result = await prisma.marathonEvent.createMany({
    data: koreanMarathonEvents.map(event => ({
      ...event,
      isOfficial: true,
    })),
  });

  return NextResponse.json({
    message: "Events seeded successfully",
    count: result.count
  });
}
