import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search } from "lucide-react";
import Link from "next/link";

export default async function CrewsPage() {
  const session = await auth();

  // Get user's crews
  const myCrews = await prisma.crew.findMany({
    where: {
      members: {
        some: { userId: session?.user?.id },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get public crews user is not a member of
  const discoverCrews = await prisma.crew.findMany({
    where: {
      isPublic: true,
      NOT: {
        members: {
          some: { userId: session?.user?.id },
        },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-text-primary">크루</h1>
        <Link href="/crews/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            만들기
          </Button>
        </Link>
      </header>

      {/* My Crews */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">내 크루</h2>
        {myCrews.length === 0 ? (
          <Card className="text-center py-8">
            <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary mb-4">아직 가입한 크루가 없습니다</p>
            <Link href="/crews/new">
              <Button variant="secondary" size="sm">
                크루 만들기
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {myCrews.map((crew) => (
              <Link key={crew.id} href={`/crews/${crew.id}`}>
                <Card variant="interactive">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[--radius-lg] bg-primary flex items-center justify-center text-white text-xl font-bold">
                      {crew.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary">{crew.name}</h3>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        👥 {crew._count.members}명
                      </p>
                      {crew.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          {crew.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Discover Crews */}
      {discoverCrews.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text-primary">크루 찾기</h2>
            <Link href="/crews/discover" className="text-sm text-primary">
              전체보기
            </Link>
          </div>
          <div className="space-y-3">
            {discoverCrews.map((crew) => (
              <Link key={crew.id} href={`/crews/${crew.id}`}>
                <Card variant="interactive">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[--radius-lg] bg-surface-elevated flex items-center justify-center text-text-secondary text-xl font-bold">
                      {crew.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary">{crew.name}</h3>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        👥 {crew._count.members}명
                      </p>
                      {crew.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          {crew.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
