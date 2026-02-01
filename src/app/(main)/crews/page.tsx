"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SwipeableItem } from "@/components/ui/swipeable-item";
import { Plus, Users, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default function CrewsPage() {
  const router = useRouter();
  const [myCrews, setMyCrews] = useState<Crew[]>([]);
  const [discoverCrews, setDiscoverCrews] = useState<Crew[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"my" | "discover">("my");
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    setIsLoading(true);
    try {
      const [myResponse, discoverResponse] = await Promise.all([
        fetch("/api/crews?filter=my"),
        fetch("/api/crews?discover=true"),
      ]);

      if (myResponse.ok) {
        setMyCrews(await myResponse.json());
      }
      if (discoverResponse.ok) {
        setDiscoverCrews(await discoverResponse.json());
      }
    } catch (error) {
      console.error("Failed to fetch crews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (crewId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJoiningId(crewId);
    try {
      const response = await fetch(`/api/crews/${crewId}/members`, {
        method: "POST",
      });

      if (response.ok) {
        // Move crew from discover to my crews
        const joinedCrew = discoverCrews.find((c) => c.id === crewId);
        if (joinedCrew) {
          setMyCrews((prev) => [joinedCrew, ...prev]);
          setDiscoverCrews((prev) => prev.filter((c) => c.id !== crewId));
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to join crew:", error);
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeaveCrew = async (crewId: string) => {
    if (!confirm("이 크루에서 나가시겠습니까?")) return;

    setLeavingId(crewId);
    try {
      const response = await fetch(`/api/crews/${crewId}/members`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from my crews
        const leftCrew = myCrews.find((c) => c.id === crewId);
        setMyCrews((prev) => prev.filter((c) => c.id !== crewId));
        // Add to discover crews if public
        if (leftCrew) {
          setDiscoverCrews((prev) => [leftCrew, ...prev]);
        }
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "크루 나가기에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to leave crew:", error);
      alert("크루 나가기에 실패했습니다.");
    } finally {
      setLeavingId(null);
    }
  };

  const filteredMyCrews = myCrews.filter(
    (crew) =>
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDiscoverCrews = discoverCrews.filter(
    (crew) =>
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentCrews = activeTab === "my" ? filteredMyCrews : filteredDiscoverCrews;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-text-primary">크루</h1>
        <Link href="/crews/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            만들기
          </Button>
        </Link>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="크루 검색..."
          className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

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
          내 크루 ({myCrews.length})
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === "discover"
              ? "text-primary border-primary"
              : "text-text-tertiary border-transparent hover:text-text-secondary"
          }`}
        >
          크루 찾기 ({discoverCrews.length})
        </button>
      </div>

      {/* Crew List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-text-tertiary mt-3">불러오는 중...</p>
        </div>
      ) : currentCrews.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">
            {activeTab === "my"
              ? searchQuery
                ? "검색 결과가 없습니다"
                : "아직 가입한 크루가 없습니다"
              : searchQuery
              ? "검색 결과가 없습니다"
              : "가입 가능한 크루가 없습니다"}
          </p>
          {activeTab === "my" && !searchQuery && (
            <Link href="/crews/new" className="inline-block mt-4">
              <Button variant="secondary" size="sm">
                크루 만들기
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {currentCrews.map((crew) =>
            activeTab === "my" ? (
              <SwipeableItem
                key={crew.id}
                onDelete={() => handleLeaveCrew(crew.id)}
                onClick={() => router.push(`/crews/${crew.id}`)}
                deleteLabel="나가기"
                isDeleting={leavingId === crew.id}
              >
                <Card variant="interactive" className="rounded-none">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 bg-primary text-white">
                      {crew.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary">{crew.name}</h3>
                      <p className="text-sm text-text-tertiary">
                        👥 {crew._count.members}명
                      </p>
                      {crew.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          {crew.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </SwipeableItem>
            ) : (
              <Link key={crew.id} href={`/crews/${crew.id}`}>
                <Card variant="interactive">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 bg-surface-elevated text-text-secondary">
                      {crew.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary">{crew.name}</h3>
                      <p className="text-sm text-text-tertiary">
                        👥 {crew._count.members}명
                      </p>
                      {crew.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          {crew.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => handleJoin(crew.id, e)}
                      disabled={joiningId === crew.id}
                    >
                      {joiningId === crew.id ? (
                        "가입 중..."
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          가입
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
