import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Trophy, Clock, TrendingUp, Gauge, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Get user's running stats
  const records = await prisma.runningLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  // Calculate stats
  const totalDistance = records.reduce((sum, r) => sum + r.distance, 0);
  const totalRuns = records.length;
  const bestPace = records.length > 0
    ? Math.min(...records.filter(r => r.pace).map(r => r.pace!))
    : null;

  // Get recent records (last 3)
  const recentRecords = records.slice(0, 3);

  // Get user's crews
  const crews = await prisma.crew.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      _count: { select: { members: true } },
    },
    take: 2,
  });

  // Format functions
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatPace = (pace: number | null) => {
    if (!pace) return "-";
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-text-primary">
          안녕하세요, {session?.user?.name || "러너"}님!
        </h1>
        <p className="text-text-secondary mt-1">오늘도 함께 달려볼까요?</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-primary" />}
          value={totalRuns.toString()}
          label="러닝 기록"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          value={`${totalDistance.toFixed(1)}km`}
          label="총 거리"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-warning" />}
          value={formatPace(bestPace)}
          label="최고 페이스"
        />
      </div>

      {/* Pace Chart Link */}
      <Link href="/pace-chart">
        <Card className="flex items-center justify-between p-4 hover:shadow-toss-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">페이스 차트</p>
              <p className="text-sm text-text-tertiary">그룹별 목표 시간 & 페이스 확인</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-tertiary" />
        </Card>
      </Link>

      {/* Recent Records */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">최근 기록</h2>
          <Link href="/records" className="text-sm text-primary">
            전체보기
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-tertiary mb-3">아직 기록이 없습니다</p>
            <Link
              href="/records/new"
              className="text-primary text-sm font-medium"
            >
              첫 기록 추가하기 →
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <Link key={record.id} href={`/records/${record.id}`}>
                <Card variant="interactive">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">
                        {record.distance.toFixed(2)} km
                      </p>
                      <p className="text-sm text-text-tertiary">
                        {formatDate(record.date)}
                        {record.notes && ` • ${record.notes}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {formatDuration(record.duration)}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatPace(record.pace)} /km
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My Crews */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">내 크루</h2>
          <Link href="/crews" className="text-sm text-primary">
            전체보기
          </Link>
        </div>

        {crews.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-tertiary mb-3">가입한 크루가 없습니다</p>
            <Link href="/crews" className="text-primary text-sm font-medium">
              크루 찾아보기 →
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {crews.map((crew) => (
              <Link key={crew.id} href={`/crews/${crew.id}`}>
                <Card variant="interactive">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white text-lg font-bold">
                      {crew.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{crew.name}</p>
                      <p className="text-sm text-text-tertiary">
                        👥 {crew._count.members}명
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card padding="sm" className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </Card>
  );
}
