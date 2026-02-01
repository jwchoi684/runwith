import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Bell,
  Lock,
  HelpCircle,
  Trophy,
  Target,
  Flame,
  ChevronRight,
  Shield,
  Users,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "./logout-button";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  // Get user stats
  const records = await prisma.runningLog.findMany({
    where: { userId: user?.id },
  });

  const totalRuns = records.length;
  const totalDistance = records.reduce((sum, r) => sum + r.distance, 0);
  const bestPace = records.length > 0
    ? Math.min(...records.filter(r => r.pace).map(r => r.pace!))
    : null;

  // Get user's crews count
  const crewsCount = await prisma.crewMember.count({
    where: { userId: user?.id },
  });

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user?.id },
    select: { role: true },
  });
  const isAdmin = dbUser?.role === "admin";

  // Calculate achievements
  const hasFirstRun = totalRuns >= 1;
  const has10Runs = totalRuns >= 10;
  const has100km = totalDistance >= 100;
  const hasSub5Pace = bestPace && bestPace < 5;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const formatPace = (pace: number | null) => {
    if (!pace) return "-";
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-text-primary">프로필</h1>
        <Link href="/profile/settings">
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      {/* Profile Card */}
      <Card className="text-center py-6">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4 ring-4 ring-primary/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
        )}
        <h2 className="text-xl font-bold text-text-primary">
          {user?.name || "러너"}
        </h2>
        <p className="text-text-tertiary text-sm mt-1">{user?.email}</p>
        <p className="text-text-secondary text-sm mt-2">
          {crewsCount > 0 ? `${crewsCount}개 크루 활동 중` : "아직 크루가 없습니다"}
        </p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-primary" />}
          value={totalRuns.toString()}
          label="러닝 기록"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-success" />}
          value={`${totalDistance.toFixed(1)}km`}
          label="총 거리"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-warning" />}
          value={formatPace(bestPace)}
          label="최고 페이스"
        />
      </div>

      {/* Achievements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary">업적</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <AchievementBadge icon="🏃" label="첫 러닝" locked={!hasFirstRun} />
          <AchievementBadge icon="🔥" label="10회 달성" locked={!has10Runs} />
          <AchievementBadge icon="💯" label="100km" locked={!has100km} />
          <AchievementBadge icon="⚡" label="5분 페이스" locked={!hasSub5Pace} />
        </div>
      </section>

      {/* Crew Section */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">크루</h3>
        <div className="space-y-1">
          <Link href="/crews">
            <div className="w-full flex items-center justify-between p-4 rounded-[--radius-lg] hover:bg-surface-elevated transition-colors duration-200">
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary"><Users className="w-5 h-5" /></span>
                <span className="font-medium text-text-primary">내 크루</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-tertiary">{crewsCount}개</span>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </div>
            </div>
          </Link>
          <Link href="/crews/new">
            <div className="w-full flex items-center justify-between p-4 rounded-[--radius-lg] hover:bg-surface-elevated transition-colors duration-200">
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary"><Plus className="w-5 h-5" /></span>
                <span className="font-medium text-text-primary">크루 만들기</span>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </div>
          </Link>
        </div>
      </section>

      {/* Settings Menu */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">설정</h3>
        <div className="space-y-1">
          {isAdmin && (
            <Link href="/admin">
              <div className="w-full flex items-center justify-between p-4 rounded-[--radius-lg] hover:bg-surface-elevated transition-colors duration-200 bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className="text-primary"><Shield className="w-5 h-5" /></span>
                  <span className="font-medium text-primary">관리자 대시보드</span>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </Link>
          )}
          <MenuItem icon={<Bell className="w-5 h-5" />} label="알림 설정" />
          <MenuItem icon={<Lock className="w-5 h-5" />} label="개인정보 설정" />
          <MenuItem icon={<HelpCircle className="w-5 h-5" />} label="도움말" />
          <LogoutButton />
        </div>
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

function AchievementBadge({
  icon,
  label,
  locked = false,
}: {
  icon: string;
  label: string;
  locked?: boolean;
}) {
  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-3 min-w-[72px]
        rounded-[--radius-lg] bg-surface-elevated
        ${locked ? "opacity-40" : ""}
      `}
    >
      <span className="text-2xl">{locked ? "🔒" : icon}</span>
      <span className="text-xs text-text-secondary whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function MenuItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="w-full flex items-center justify-between p-4 rounded-[--radius-lg] hover:bg-surface-elevated transition-colors duration-200"
    >
      <div className="flex items-center gap-3">
        <span className="text-text-tertiary">{icon}</span>
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-text-tertiary" />
    </button>
  );
}
