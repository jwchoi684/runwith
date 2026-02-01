"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  FileText,
  Users2,
  Trophy,
  ArrowLeft,
  Shield,
  ShieldOff,
  Search,
  Globe,
  Lock,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: {
    runningLogs: number;
    crews: number;
    ownedCrews: number;
  };
}

interface RunningLog {
  id: string;
  date: Date;
  distance: number;
  duration: number;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  event: {
    name: string;
  } | null;
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  owner: {
    name: string | null;
    email: string | null;
  };
  _count: {
    members: number;
  };
}

interface Stats {
  totalUsers: number;
  totalRecords: number;
  totalCrews: number;
  totalEvents: number;
}

interface AdminDashboardProps {
  users: User[];
  stats: Stats;
  recentRecords: RunningLog[];
  crews: Crew[];
  currentUserId: string;
}

type Tab = "overview" | "users" | "records" | "crews";

export function AdminDashboard({
  users,
  stats,
  recentRecords,
  crews,
  currentUserId,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  const handlePromoteUser = async (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole === "user") {
      if (!confirm("자신의 관리자 권한을 해제하시겠습니까? 이 작업 후에는 관리자 페이지에 접근할 수 없습니다.")) {
        return;
      }
    }

    setPromotingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "권한 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("권한 변경에 실패했습니다.");
    } finally {
      setPromotingUserId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "overview" as Tab, label: "개요", icon: FileText },
    { id: "users" as Tab, label: "사용자", icon: Users },
    { id: "records" as Tab, label: "기록", icon: Trophy },
    { id: "crews" as Tab, label: "크루", icon: Users2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-text-primary">관리자 대시보드</h1>
              <p className="text-sm text-text-tertiary">시스템 관리 및 사용자 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Admin</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center py-6">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
                <p className="text-sm text-text-tertiary">전체 사용자</p>
              </Card>
              <Card className="text-center py-6">
                <FileText className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{stats.totalRecords}</p>
                <p className="text-sm text-text-tertiary">전체 기록</p>
              </Card>
              <Card className="text-center py-6">
                <Users2 className="w-8 h-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{stats.totalCrews}</p>
                <p className="text-sm text-text-tertiary">전체 크루</p>
              </Card>
              <Card className="text-center py-6">
                <Trophy className="w-8 h-8 text-error mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{stats.totalEvents}</p>
                <p className="text-sm text-text-tertiary">마라톤 대회</p>
              </Card>
            </div>

            {/* Recent Records */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">최근 기록</h2>
              <Card className="divide-y divide-border">
                {recentRecords.length === 0 ? (
                  <p className="text-center text-text-tertiary py-8">기록이 없습니다</p>
                ) : (
                  recentRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-4">
                      {record.user.image ? (
                        <Image
                          src={record.user.image}
                          alt={record.user.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                          {record.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {record.user.name || record.user.email}
                        </p>
                        <p className="text-sm text-text-tertiary">
                          {record.event?.name || "개인 기록"} · {record.distance.toFixed(2)}km
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary">{formatDuration(record.duration)}</p>
                        <p className="text-xs text-text-tertiary">{formatDate(record.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </section>
          </>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <Card className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-text-tertiary py-8">사용자가 없습니다</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-4">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium text-lg">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary truncate">
                          {user.name || "Unknown"}
                        </p>
                        {user.role === "admin" && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-tertiary truncate">{user.email}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        기록 {user._count.runningLogs}개 · 크루 {user._count.crews}개 · 운영 크루 {user._count.ownedCrews}개
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-text-tertiary">{formatDate(user.createdAt)}</p>
                      {user.role === "admin" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePromoteUser(user.id, "user")}
                          disabled={promotingUserId === user.id}
                          className="text-error hover:bg-error/10"
                        >
                          <ShieldOff className="w-4 h-4 mr-1" />
                          {promotingUserId === user.id ? "처리 중..." : "권한 해제"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePromoteUser(user.id, "admin")}
                          disabled={promotingUserId === user.id}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          {promotingUserId === user.id ? "처리 중..." : "관리자로 승격"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>
        )}

        {/* Records Tab */}
        {activeTab === "records" && (
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">전체 기록</h2>
            <Card className="divide-y divide-border">
              {recentRecords.length === 0 ? (
                <p className="text-center text-text-tertiary py-8">기록이 없습니다</p>
              ) : (
                recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center gap-3 p-4">
                    {record.user.image ? (
                      <Image
                        src={record.user.image}
                        alt={record.user.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                        {record.user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {record.user.name || record.user.email}
                      </p>
                      <p className="text-sm text-text-tertiary">
                        {record.event?.name || "개인 기록"} · {record.distance.toFixed(2)}km
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary">{formatDuration(record.duration)}</p>
                      <p className="text-xs text-text-tertiary">{formatDate(record.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>
        )}

        {/* Crews Tab */}
        {activeTab === "crews" && (
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">전체 크루</h2>
            <Card className="divide-y divide-border">
              {crews.length === 0 ? (
                <p className="text-center text-text-tertiary py-8">크루가 없습니다</p>
              ) : (
                crews.map((crew) => (
                  <div key={crew.id} className="flex items-center gap-3 p-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                      {crew.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary truncate">{crew.name}</p>
                        {crew.isPublic ? (
                          <Globe className="w-4 h-4 text-text-tertiary" />
                        ) : (
                          <Lock className="w-4 h-4 text-text-tertiary" />
                        )}
                      </div>
                      <p className="text-sm text-text-tertiary truncate">
                        {crew.description || "설명 없음"}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        크루장: {crew.owner.name || crew.owner.email} · 멤버 {crew._count.members}명
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-tertiary">{formatDate(crew.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
