import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CrewDetail } from "./crew-detail";

type Params = Promise<{ id: string }>;

export default async function CrewPage({ params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  const crew = await prisma.crew.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!crew) {
    notFound();
  }

  const isMember = crew.members.some((m) => m.userId === session?.user?.id);
  const isOwner = crew.ownerId === session?.user?.id;

  return (
    <CrewDetail
      crew={crew}
      isMember={isMember}
      isOwner={isOwner}
      currentUserId={session?.user?.id}
    />
  );
}
