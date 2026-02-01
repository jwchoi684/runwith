import { Card } from "@/components/ui/card";
import { Medal, Trophy, Award } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-text-primary">리더보드</h1>
      </header>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterChip label="풀마라톤" active />
        <FilterChip label="하프마라톤" />
        <FilterChip label="10K" />
        <FilterChip label="5K" />
      </div>

      {/* Time Range Tabs */}
      <div className="flex border-b border-border">
        <TabButton label="이번 주" active />
        <TabButton label="이번 달" />
        <TabButton label="올해" />
        <TabButton label="전체" />
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 py-6">
        {/* 2nd Place */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-surface-elevated mx-auto mb-2 flex items-center justify-center">
            <span className="text-xl font-bold">SK</span>
          </div>
          <p className="text-sm font-medium text-text-primary">Sarah Kim</p>
          <p className="text-xs text-text-tertiary">3:02:15</p>
          <div className="w-16 h-20 bg-gray-400 rounded-t-lg mt-2 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">2</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-2 flex items-center justify-center border-4 border-yellow-400">
              <span className="text-2xl font-bold text-white">JK</span>
            </div>
            <Trophy className="w-6 h-6 text-yellow-400 absolute -top-2 left-1/2 -translate-x-1/2" />
          </div>
          <p className="text-base font-semibold text-text-primary">Jay Kim</p>
          <p className="text-sm text-primary font-bold">2:58:42</p>
          <div className="w-20 h-28 bg-yellow-500 rounded-t-lg mt-2 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">1</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-surface-elevated mx-auto mb-2 flex items-center justify-center">
            <span className="text-xl font-bold">MP</span>
          </div>
          <p className="text-sm font-medium text-text-primary">Min Park</p>
          <p className="text-xs text-text-tertiary">3:05:30</p>
          <div className="w-16 h-16 bg-amber-600 rounded-t-lg mt-2 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">3</span>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        <LeaderboardItem rank={4} name="James Park" time="3:08:42" />
        <LeaderboardItem rank={5} name="Min Ji Lee" time="3:12:15" />
        <LeaderboardItem rank={6} name="David Cho" time="3:15:33" />
        <LeaderboardItem rank={7} name="Emma Wang" time="3:18:07" />

        {/* My Position */}
        <div className="py-2">
          <Card className="border-primary bg-primary/10">
            <div className="flex items-center gap-4">
              <span className="w-8 text-center font-bold text-primary">42</span>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                나
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">나 (You)</p>
              </div>
              <p className="font-bold text-primary">4:12:30</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`
        px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
        transition-colors duration-200
        ${
          active
            ? "bg-primary text-white"
            : "bg-surface-elevated text-text-secondary hover:bg-border"
        }
      `}
    >
      {label}
    </button>
  );
}

function TabButton({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`
        flex-1 py-3 text-sm font-medium text-center
        border-b-2 transition-colors duration-200
        ${
          active
            ? "text-primary border-primary"
            : "text-text-tertiary border-transparent hover:text-text-secondary"
        }
      `}
    >
      {label}
    </button>
  );
}

function LeaderboardItem({
  rank,
  name,
  time,
}: {
  rank: number;
  name: string;
  time: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="w-8 text-center font-bold text-text-tertiary">
          {rank}
        </span>
        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-primary font-semibold">
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="flex-1">
          <p className="font-medium text-text-primary">{name}</p>
        </div>
        <p className="font-bold text-text-secondary">{time}</p>
      </div>
    </Card>
  );
}
