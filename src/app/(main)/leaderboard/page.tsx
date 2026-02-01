"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Users, ChevronDown } from "lucide-react";
import Image from "next/image";

interface Crew {
  id: string;
  name: string;
}

interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  userImage: string | null;
  totalDistance: number;
  totalRuns: number;
  bestPace: number | null;
}

const distanceFilters = [
  { label: "전체", value: "all" },
  { label: "Full", value: "42" },
  { label: "Half", value: "21" },
  { label: "10K", value: "10" },
  { label: "5K", value: "5" },
];

export default function LeaderboardPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<string>("all");
  const [selectedDistance, setSelectedDistance] = useState("all");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);

  useEffect(() => {
    fetchCrews();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCrew, selectedDistance]);

  const fetchCrews = async () => {
    try {
      const response = await fetch("/api/crews?filter=my");
      if (response.ok) {
        const data = await response.json();
        setCrews(data);
      }
    } catch (error) {
      console.error("Failed to fetch crews:", error);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        crew: selectedCrew,
        distance: selectedDistance,
      });
      const response = await fetch(`/api/leaderboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (km: number) => {
    return km >= 1000 ? `${(km / 1000).toFixed(1)}K` : km.toFixed(3);
  };

  const formatPace = (pace: number | null) => {
    if (!pace) return "-";
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}'${secs.toString().padStart(2, "0")}"`;
  };

  const getCrewLabel = () => {
    if (selectedCrew === "all") return "전체";
    return crews.find((c) => c.id === selectedCrew)?.name || "전체";
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-text-primary">리더보드</h1>
      </header>

      {/* Crew Filter */}
      <div className="relative">
        <button
          onClick={() => setShowCrewDropdown(!showCrewDropdown)}
          className="w-full flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-text-tertiary" />
            <span className="text-text-primary font-medium">{getCrewLabel()}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${showCrewDropdown ? "rotate-180" : ""}`} />
        </button>

        {showCrewDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 overflow-hidden">
            <button
              onClick={() => { setSelectedCrew("all"); setShowCrewDropdown(false); }}
              className={`w-full px-4 py-3 text-left hover:bg-surface-elevated ${selectedCrew === "all" ? "bg-primary/10 text-primary" : "text-text-primary"}`}
            >
              전체
            </button>
            {crews.map((crew) => (
              <button
                key={crew.id}
                onClick={() => { setSelectedCrew(crew.id); setShowCrewDropdown(false); }}
                className={`w-full px-4 py-3 text-left hover:bg-surface-elevated ${selectedCrew === crew.id ? "bg-primary/10 text-primary" : "text-text-primary"}`}
              >
                {crew.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Distance Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {distanceFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedDistance(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDistance === filter.value
                ? "bg-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:bg-border"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-text-tertiary mt-3">불러오는 중...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">아직 기록이 없습니다</p>
        </Card>
      ) : (
        <>
          {/* Podium for top 3 */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 py-6">
              {/* 2nd Place */}
              <PodiumItem entry={leaderboard[1]} rank={2} />
              {/* 1st Place */}
              <PodiumItem entry={leaderboard[0]} rank={1} />
              {/* 3rd Place */}
              <PodiumItem entry={leaderboard[2]} rank={3} />
            </div>
          )}

          {/* Show all entries as list when less than 3, or entries after top 3 */}
          <div className="space-y-2">
            {(leaderboard.length < 3 ? leaderboard : leaderboard.slice(3)).map((entry, index) => {
              const rank = leaderboard.length < 3 ? index + 1 : index + 4;
              return (
                <Card key={entry.userId}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 text-center font-bold ${rank <= 3 ? "text-primary" : "text-text-tertiary"}`}>
                      {rank}
                    </span>
                    {entry.userImage ? (
                      <Image
                        src={entry.userImage}
                        alt={entry.userName || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-primary font-semibold">
                        {entry.userName?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{entry.userName || "Unknown"}</p>
                      <p className="text-xs text-text-tertiary">{entry.totalRuns}회</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-secondary">{formatDistance(entry.totalDistance)} km</p>
                      <p className="text-xs text-text-tertiary">{formatPace(entry.bestPace)} /km</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PodiumItem({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const sizes = {
    1: { avatar: "w-20 h-20", bar: "w-20 h-28", text: "text-2xl" },
    2: { avatar: "w-16 h-16", bar: "w-16 h-20", text: "text-xl" },
    3: { avatar: "w-16 h-16", bar: "w-16 h-16", text: "text-xl" },
  };
  const colors = {
    1: "bg-yellow-500",
    2: "bg-gray-400",
    3: "bg-amber-600",
  };
  const size = sizes[rank as keyof typeof sizes];
  const color = colors[rank as keyof typeof colors];

  return (
    <div className="text-center">
      <div className="relative">
        {entry.userImage ? (
          <Image
            src={entry.userImage}
            alt={entry.userName || "User"}
            width={rank === 1 ? 80 : 64}
            height={rank === 1 ? 80 : 64}
            className={`${size.avatar} rounded-full mx-auto mb-2 ${rank === 1 ? "border-4 border-yellow-400" : ""}`}
          />
        ) : (
          <div className={`${size.avatar} rounded-full bg-surface-elevated mx-auto mb-2 flex items-center justify-center ${rank === 1 ? "border-4 border-yellow-400" : ""}`}>
            <span className={`${size.text} font-bold`}>{entry.userName?.[0]?.toUpperCase() || "U"}</span>
          </div>
        )}
        {rank === 1 && (
          <Trophy className="w-6 h-6 text-yellow-400 absolute -top-2 left-1/2 -translate-x-1/2" />
        )}
      </div>
      <p className={`${rank === 1 ? "text-base font-semibold" : "text-sm font-medium"} text-text-primary`}>
        {entry.userName || "Unknown"}
      </p>
      <p className={`text-xs ${rank === 1 ? "text-primary font-bold" : "text-text-tertiary"}`}>
        {entry.totalDistance.toFixed(3)} km
      </p>
      <div className={`${size.bar} ${color} rounded-t-lg mt-2 flex items-center justify-center mx-auto`}>
        <span className={`${rank === 1 ? "text-3xl" : "text-2xl"} font-bold text-white`}>{rank}</span>
      </div>
    </div>
  );
}
