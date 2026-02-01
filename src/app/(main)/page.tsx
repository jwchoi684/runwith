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
    <div className="px-5 py-6 space-y-8 pb-24">
      {/* Header */}
      <header>
        <h1 className="text-[22px] font-bold text-text-primary leading-tight">
          안녕하세요, {session?.user?.name || "러너"}님!
        </h1>
        <p className="text-text-secondary text-[15px] mt-1.5">오늘도 함께 달려볼까요?</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2.5">
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
      <Link href="/pace-chart" className="block">
        <Card padding="none" className="flex items-center justify-between px-4 py-3.5 hover:shadow-toss-lg transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-[15px] text-text-primary">페이스 차트</p>
              <p className="text-[13px] text-text-tertiary mt-0.5">그룹별 목표 시간 & 페이스 확인</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-tertiary" />
        </Card>
      </Link>

      {/* Recent Records */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-text-primary">최근 기록</h2>
          <Link href="/records" className="text-[14px] text-primary font-medium">
            전체보기
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-text-tertiary text-[15px] mb-3">아직 기록이 없습니다</p>
            <Link
              href="/records/new"
              className="text-primary text-[14px] font-medium"
            >
              첫 기록 추가하기 →
            </Link>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {recentRecords.map((record) => (
              <Link key={record.id} href={`/records/${record.id}`} className="block">
                <Card variant="interactive" padding="none" className="px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[15px] text-text-primary">
                        {record.distance.toFixed(2)} km
                      </p>
                      <p className="text-[13px] text-text-tertiary mt-0.5">
                        {formatDate(record.date)}
                        {record.notes && ` · ${record.notes}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-primary tabular-nums">
                        {formatDuration(record.duration)}
                      </p>
                      <p className="text-[13px] text-text-secondary mt-0.5 tabular-nums">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-text-primary">내 크루</h2>
          <Link href="/crews" className="text-[14px] text-primary font-medium">
            전체보기
          </Link>
        </div>

        {crews.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-text-tertiary text-[15px] mb-3">가입한 크루가 없습니다</p>
            <Link href="/crews" className="text-primary text-[14px] font-medium">
              크루 찾아보기 →
            </Link>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {crews.map((crew) => (
              <Link key={crew.id} href={`/crews/${crew.id}`} className="block">
                <Card variant="interactive" padding="none" className="px-4 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] bg-primary flex items-center justify-center text-white text-[17px] font-bold">
                      {crew.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[15px] text-text-primary">{crew.name}</p>
                      <p className="text-[13px] text-text-tertiary mt-0.5">
                        멤버 {crew._count.members}명
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
    <Card padding="none" className="text-center py-4 px-2">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-[17px] font-bold text-text-primary tabular-nums">{value}</p>
      <p className="text-[11px] text-text-tertiary mt-0.5">{label}</p>
    </Card>
  );
}
