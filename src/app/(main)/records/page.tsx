import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecordsList } from "./records-list";

export default async function RecordsPage() {
  const session = await auth();

  // 내 기록
  const myRecords = await prisma.runningLog.findMany({
    where: { userId: session?.user?.id },
    orderBy: { date: "desc" },
    include: {
      event: true,
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // 내 크루 목록
  const myCrews = await prisma.crewMember.findMany({
    where: { userId: session?.user?.id },
    include: {
      crew: {
        include: {
          members: {
            select: { userId: true },
          },
        },
      },
    },
  });

  // 크루 멤버들의 userId 추출 (나 제외)
  const crewMemberIds = new Set<string>();
  myCrews.forEach((membership) => {
    membership.crew.members.forEach((member) => {
      if (member.userId !== session?.user?.id) {
        crewMemberIds.add(member.userId);
      }
    });
  });

  // 크루 기록 (크루 멤버들의 기록)
  const crewRecords = await prisma.runningLog.findMany({
    where: {
      userId: { in: Array.from(crewMemberIds) },
    },
    orderBy: { date: "desc" },
    include: {
      event: true,
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return (
    <RecordsList
      myRecords={myRecords}
      crewRecords={crewRecords}
      currentUserId={session?.user?.id || ""}
    />
  );
}
