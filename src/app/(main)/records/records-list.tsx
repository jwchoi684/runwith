"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SwipeableItem } from "@/components/ui/swipeable-item";
import { Plus, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface MarathonEvent {
  id: string;
  name: string;
  location: string | null;
  distance: number;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface RunningLog {
  id: string;
  date: Date;
  distance: number;
  duration: number;
  pace: number | null;
  notes: string | null;
  event: MarathonEvent | null;
  user: User;
}

interface RecordsListProps {
  myRecords: RunningLog[];
  crewRecords: RunningLog[];
  currentUserId: string;
}

export function RecordsList({ myRecords, crewRecords, currentUserId }: RecordsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my" | "crew">("my");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;

    setDeletingId(recordId);
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

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

  const currentRecords = activeTab === "my" ? myRecords : crewRecords;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-text-primary">기록</h1>
        <Link href="/records/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === "my"
              ? "text-primary border-primary"
              : "text-text-tertiary border-transparent hover:text-text-secondary"
          }`}
        >
          내 기록 ({myRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("crew")}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === "crew"
              ? "text-primary border-primary"
              : "text-text-tertiary border-transparent hover:text-text-secondary"
          }`}
        >
          크루 기록 ({crewRecords.length})
        </button>
      </div>

      {/* Records List */}
      {currentRecords.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🏃</div>
          <p className="text-text-secondary mb-4">
            {activeTab === "my" ? "아직 기록이 없습니다" : "크루 멤버의 기록이 없습니다"}
          </p>
          {activeTab === "my" && (
            <Link href="/records/new">
              <Button>
                <Plus className="w-4 h-4 mr-1" />첫 기록 추가하기
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {currentRecords.map((record) => {
            const isMyRecord = record.user.id === currentUserId;

            return isMyRecord ? (
              <SwipeableItem
                key={record.id}
                onDelete={() => handleDeleteRecord(record.id)}
                onClick={() => router.push(`/records/${record.id}`)}
                isDeleting={deletingId === record.id}
              >
                <Card variant="interactive" className="rounded-none">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      {record.event ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                            <p className="font-medium text-text-primary truncate">
                              {record.event.name}
                            </p>
                          </div>
                          <p className="text-sm text-text-tertiary mt-0.5">
                            {formatDate(record.date)} • {record.distance.toFixed(3)} km
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-text-primary">
                            {record.distance.toFixed(3)} km
                          </p>
                          <p className="text-sm text-text-tertiary mt-0.5">
                            {formatDate(record.date)}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-primary">
                        {formatDuration(record.duration)}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatPace(record.pace)} /km
                      </p>
                    </div>
                  </div>
                </Card>
              </SwipeableItem>
            ) : (
              <Card key={record.id}>
                <div className="flex items-center gap-3">
                  {/* User Avatar (only for crew records) */}
                  <div className="shrink-0">
                    {record.user.image ? (
                      <Image
                        src={record.user.image}
                        alt={record.user.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-primary font-semibold">
                        {record.user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-tertiary mb-1">
                      {record.user.name || "Unknown"}
                    </p>

                    {record.event ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                          <p className="font-medium text-text-primary truncate">
                            {record.event.name}
                          </p>
                        </div>
                        <p className="text-sm text-text-tertiary mt-0.5">
                          {formatDate(record.date)} • {record.distance.toFixed(3)} km
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-text-primary">
                          {record.distance.toFixed(3)} km
                        </p>
                        <p className="text-sm text-text-tertiary mt-0.5">
                          {formatDate(record.date)}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-primary">
                      {formatDuration(record.duration)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {formatPace(record.pace)} /km
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
