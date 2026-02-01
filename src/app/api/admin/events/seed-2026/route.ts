import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const events2026 = [
  {
    name: "2026 네버스탑: 1,000K 돌파 팀마라톤",
    date: "2026-02-02",
    courses: "Custom (1,000km 팀)",
    location: "전국",
  },
  {
    name: "제3회 산들소리향기마라톤",
    date: "2026-02-08",
    courses: "Half,10K,5K",
    location: "상암 월드컵공원 평화광장",
  },
  {
    name: "2026 청춘릴레이 마라톤",
    date: "2026-02-21",
    courses: "Half,10K,5K",
    location: "상암 월드컵공원 평화광장",
  },
  {
    name: "2026 고구려 마라톤",
    date: "2026-02-22",
    courses: "Full,Half,10K,Custom (32km)",
    location: "뚝섬한강공원 수변무대",
  },
  {
    name: "2026 대구마라톤",
    date: "2026-02-22",
    courses: "Full,10K,5K",
    location: "대구스타디움",
  },
  {
    name: "2026 Run your way HALF",
    date: "2026-03-01",
    courses: "Half",
    location: "광화문광장",
  },
  {
    name: "2026 머니투데이방송 삼일절 마라톤",
    date: "2026-03-01",
    courses: "Full,Half,10K,5K",
    location: "뚝섬한강공원 수변무대",
  },
  {
    name: "2026 고양특례시 하프마라톤",
    date: "2026-03-08",
    courses: "Half,10K,5K",
    location: "고양종합운동장",
  },
  {
    name: "2026 서울마라톤",
    date: "2026-03-15",
    courses: "Full,10K",
    location: "광화문광장",
  },
  {
    name: "제26회 인천국제하프마라톤",
    date: "2026-03-22",
    courses: "Half,10K,5K",
    location: "인천문학경기장",
  },
  {
    name: "제23회 태화강 마라톤",
    date: "2026-03-28",
    courses: "Full,Half,10K,5K",
    location: "태화강 국가정원",
  },
  {
    name: "2026 영주포항 영일대 해상누각",
    date: "2026-04-05",
    courses: "",
    location: "",
  },
  {
    name: "제11회 김대중 평화 마라톤",
    date: "2026-06-14",
    courses: "Half,10K,5K",
    location: "상암 월드컵공원 평화광장",
  },
  {
    name: "2026 쿨밸리트레일레이스",
    date: "2026-08-01",
    courses: "Custom (18K)",
    location: "장수종합경기장",
  },
  {
    name: "제38회 지리산화대종주 Trail Run",
    date: "2026-08-15",
    courses: "Custom (48K/40K/34K)",
    location: "화엄사 주차장",
  },
  {
    name: "2026 대구세계마스터즈육상경기대회",
    date: "2026-08-30",
    courses: "Half,10K",
    location: "신천동로 일원",
  },
  {
    name: "2026 장수트레일레이스 Fall",
    date: "2026-09-19",
    courses: "Custom (100Mile/100K/38K)",
    location: "장수종합경기장",
  },
  {
    name: "제19회 가평자라섬 전국마라톤",
    date: "2026-09-20",
    courses: "Half,10K,5K",
    location: "가평종합운동장",
  },
  {
    name: "제2회 아산이순신 트레일",
    date: "2026-10-03",
    courses: "Custom (60K/46K)",
    location: "아산 신정호",
  },
  {
    name: "2026 jtbc 마라톤",
    date: "2026-11-01",
    courses: "Full,10K",
    location: "상암동 평화의 광장",
  },
];

// POST /api/admin/events/seed-2026 - Seed 2026 events (admin only)
export async function POST() {
  const session = await auth();

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

  const results = {
    created: [] as string[],
    skipped: [] as string[],
  };

  for (const event of events2026) {
    const existing = await prisma.marathonEvent.findFirst({
      where: {
        name: event.name,
        date: new Date(event.date),
      },
    });

    if (existing) {
      results.skipped.push(event.name);
      continue;
    }

    await prisma.marathonEvent.create({
      data: {
        name: event.name,
        location: event.location || null,
        distance: 0,
        courses: event.courses || null,
        date: new Date(event.date),
        isOfficial: true,
      },
    });
    results.created.push(event.name);
  }

  return NextResponse.json({
    message: `Created ${results.created.length} events, skipped ${results.skipped.length} duplicates`,
    ...results,
  });
}
