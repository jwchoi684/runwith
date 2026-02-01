import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/crew-event-counts - Get count of crew members participating in each event
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 사용자가 속한 크루 찾기
  const userCrews = await prisma.crewMember.findMany({
    where: { userId: session.user.id },
    select: { crewId: true },
  });

  if (userCrews.length === 0) {
    return NextResponse.json({});
  }

  const crewIds = userCrews.map((c) => c.crewId);

  // 크루원들 찾기
  const crewMembers = await prisma.crewMember.findMany({
    where: { crewId: { in: crewIds } },
    select: { userId: true },
  });

  const memberIds = [...new Set(crewMembers.map((m) => m.userId))];

  // 크루원들의 대회 참가 정보
  const eventParticipants = await prisma.userEvent.findMany({
    where: { userId: { in: memberIds } },
    select: {
      eventId: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // eventId별로 참가자 수와 참가자 목록 그룹화
  const eventCounts: Record<string, { count: number; participants: { id: string; name: string | null; image: string | null }[] }> = {};

  eventParticipants.forEach((ep) => {
    if (!eventCounts[ep.eventId]) {
      eventCounts[ep.eventId] = { count: 0, participants: [] };
    }
    eventCounts[ep.eventId].count++;
    eventCounts[ep.eventId].participants.push({
      id: ep.user.id,
      name: ep.user.name,
      image: ep.user.image,
    });
  });

  return NextResponse.json(eventCounts);
}
