import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function RecordsPage() {
  const session = await auth();

  const records = await prisma.runningLog.findMany({
    where: { userId: session?.user?.id },
    orderBy: { date: "desc" },
  });

  // Format duration to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Format pace to M:SS
  const formatPace = (pace: number | null) => {
    if (!pace) return "-";
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-text-primary">내 기록</h1>
        <Link href="/records/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </Link>
      </header>

      {/* Records List */}
      {records.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🏃</div>
          <p className="text-text-secondary mb-4">아직 기록이 없습니다</p>
          <Link href="/records/new">
            <Button>
              <Plus className="w-4 h-4 mr-1" />첫 기록 추가하기
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Link key={record.id} href={`/records/${record.id}`}>
              <Card variant="interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">
                      {record.distance.toFixed(3)} km
                    </p>
                    <p className="text-sm text-text-tertiary mt-0.5">
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
    </div>
  );
}
