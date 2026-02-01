"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Users, UserPlus } from "lucide-react";
import Link from "next/link";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default function DiscoverCrewsPage() {
  const router = useRouter();
  const [crews, setCrews] = useState<Crew[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      const response = await fetch("/api/crews?discover=true");
      if (response.ok) {
        const data = await response.json();
        setCrews(data);
      }
    } catch (error) {
      console.error("Failed to fetch crews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (crewId: string) => {
    setJoiningId(crewId);
    try {
      const response = await fetch(`/api/crews/${crewId}/members`, {
        method: "POST",
      });

      if (response.ok) {
        router.push(`/crews/${crewId}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to join crew:", error);
    } finally {
      setJoiningId(null);
    }
  };

  const filteredCrews = crews.filter((crew) =>
    crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crew.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center gap-3 pt-2">
        <Link href="/crews">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">크루 찾기</h1>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="크루 이름으로 검색"
          className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Crews List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-text-tertiary mt-3">크루를 불러오는 중...</p>
        </div>
      ) : filteredCrews.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">
            {searchQuery ? "검색 결과가 없습니다" : "가입 가능한 크루가 없습니다"}
          </p>
          <Link href="/crews/new" className="inline-block mt-4">
            <Button variant="secondary" size="sm">
              새 크루 만들기
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCrews.map((crew) => (
            <Card key={crew.id} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-elevated flex items-center justify-center text-text-secondary text-xl font-bold shrink-0">
                {crew.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary">{crew.name}</h3>
                <p className="text-sm text-text-tertiary">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  {crew._count.members}명
                </p>
                {crew.description && (
                  <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                    {crew.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleJoin(crew.id)}
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
