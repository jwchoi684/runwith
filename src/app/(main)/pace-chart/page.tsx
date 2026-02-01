"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, Gauge } from "lucide-react";
import Link from "next/link";

interface PaceGroup {
  id: string;
  groupNumber: number;
  name: string;
  timeFull: number;
  timeHalf: number;
  time10k: number;
  time5k: number;
  paceFull: number;
  paceHalf: number;
  pace10k: number;
  pace5k: number;
  pace1km: number;
  paceRecovery: number;
}

export default function PaceChartPage() {
  const [paceGroups, setPaceGroups] = useState<PaceGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"time" | "pace">("time");

  useEffect(() => {
    fetchPaceGroups();
  }, []);

  const fetchPaceGroups = async () => {
    try {
      const response = await fetch("/api/pace-groups");
      if (response.ok) {
        const data = await response.json();
        setPaceGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch pace groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Format pace (seconds per km) to M'SS"
  const formatPace = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}'${s.toString().padStart(2, "0")}"`;
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (paceGroups.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <header className="flex items-center gap-4 pt-2">
          <Link href="/" className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">페이스 차트</h1>
        </header>
        <Card className="text-center py-12">
          <Gauge className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">페이스 차트 데이터가 없습니다</p>
          <p className="text-sm text-text-tertiary mt-1">관리자에게 문의해주세요</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 pt-2">
        <Link href="/" className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">페이스 차트</h1>
      </header>

      {/* View Toggle */}
      <div className="flex bg-surface-elevated rounded-xl p-1">
        <button
          onClick={() => setViewMode("time")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            viewMode === "time"
              ? "bg-primary text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Clock className="w-4 h-4" />
          목표 시간
        </button>
        <button
          onClick={() => setViewMode("pace")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            viewMode === "pace"
              ? "bg-primary text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Gauge className="w-4 h-4" />
          페이스
        </button>
      </div>

      {/* Pace Chart Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === "time" ? (
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-surface-elevated border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary sticky left-0 bg-surface-elevated">그룹</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">Full</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">Half</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">10K</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">5K</th>
                </tr>
              </thead>
              <tbody>
                {paceGroups.map((group, index) => (
                  <tr
                    key={group.id}
                    className={`border-b border-border last:border-b-0 ${
                      index % 2 === 0 ? "bg-surface" : "bg-surface-elevated/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary sticky left-0 bg-inherit">
                      {group.name}
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatTime(group.timeFull)}
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatTime(group.timeHalf)}
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatTime(group.time10k)}
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatTime(group.time5k)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-surface-elevated border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary sticky left-0 bg-surface-elevated">그룹</th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary">Full</th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary">Half</th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary">10K</th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary">5K</th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary">1km</th>
                  <th className="text-center px-3 py-3 text-sm font-medium text-primary">Recovery</th>
                </tr>
              </thead>
              <tbody>
                {paceGroups.map((group, index) => (
                  <tr
                    key={group.id}
                    className={`border-b border-border last:border-b-0 ${
                      index % 2 === 0 ? "bg-surface" : "bg-surface-elevated/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary sticky left-0 bg-inherit">
                      {group.name}
                    </td>
                    <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatPace(group.paceFull)}
                    </td>
                    <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatPace(group.paceHalf)}
                    </td>
                    <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatPace(group.pace10k)}
                    </td>
                    <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatPace(group.pace5k)}
                    </td>
                    <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                      {formatPace(group.pace1km)}
                    </td>
                    <td className="px-3 py-3 text-center text-primary font-mono text-sm font-medium">
                      {formatPace(group.paceRecovery)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-medium text-text-primary mb-2">페이스 가이드</h3>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• <span className="font-medium">Full/Half/10K/5K</span>: 해당 거리 레이스 페이스</li>
          <li>• <span className="font-medium">1km</span>: 인터벌 훈련 페이스</li>
          <li>• <span className="text-primary font-medium">Recovery</span>: 회복 조깅 페이스</li>
        </ul>
      </Card>
    </div>
  );
}
