"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trash2,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Calendar,
  Timer,
  Gauge,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface RunningLog {
  id: string;
  date: Date;
  distance: number;
  duration: number;
  pace: number | null;
  notes: string | null;
  weather: string | null;
  feeling: number | null;
}

const weatherIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: Snowflake,
};

const weatherLabels: Record<string, string> = {
  sunny: "맑음",
  cloudy: "흐림",
  rainy: "비",
  snowy: "눈",
};

const feelingEmojis: Record<number, string> = {
  1: "😫",
  2: "😓",
  3: "😐",
  4: "😊",
  5: "🤩",
};

export function RecordDetail({ record }: { record: RunningLog }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

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
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 기록을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/records/${record.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/records");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const WeatherIcon = record.weather ? weatherIcons[record.weather] : null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/records">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">기록 상세</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-error hover:bg-error/10"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Stats */}
      <Card className="text-center py-6">
        <p className="text-5xl font-bold text-primary mb-2">
          {record.distance.toFixed(3)}
          <span className="text-2xl text-text-secondary ml-1">km</span>
        </p>
        <p className="text-text-tertiary">{formatDate(record.date)}</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <Timer className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatDuration(record.duration)}
          </p>
          <p className="text-xs text-text-tertiary">시간</p>
        </Card>

        <Card className="text-center">
          <div className="flex justify-center mb-2">
            <Gauge className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatPace(record.pace)}
          </p>
          <p className="text-xs text-text-tertiary">페이스 /km</p>
        </Card>
      </div>

      {/* Additional Info */}
      {(record.weather || record.feeling) && (
        <Card>
          <div className="flex items-center gap-6">
            {record.weather && WeatherIcon && (
              <div className="flex items-center gap-2">
                <WeatherIcon className="w-5 h-5 text-text-secondary" />
                <span className="text-text-primary">
                  {weatherLabels[record.weather]}
                </span>
              </div>
            )}
            {record.feeling && (
              <div className="flex items-center gap-2">
                <span className="text-xl">{feelingEmojis[record.feeling]}</span>
                <span className="text-text-primary">컨디션</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Notes */}
      {record.notes && (
        <Card>
          <p className="text-sm text-text-secondary mb-2">메모</p>
          <p className="text-text-primary">{record.notes}</p>
        </Card>
      )}
    </div>
  );
}
