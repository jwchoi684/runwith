"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Users, ChevronRight, ChevronLeft, Check, Search } from "lucide-react";

type Step = "name" | "crew";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Crew selection state
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingCrews, setIsLoadingCrews] = useState(false);
  const [joiningCrew, setJoiningCrew] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  // Fetch crews when entering crew step
  useEffect(() => {
    if (step === "crew") {
      fetchCrews();
    }
  }, [step]);

  const fetchCrews = async () => {
    setIsLoadingCrews(true);
    try {
      const response = await fetch("/api/crews?discover=true");
      if (response.ok) {
        const data = await response.json();
        setCrews(data);
      }
    } catch (error) {
      console.error("Failed to fetch crews:", error);
    } finally {
      setIsLoadingCrews(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Save name first
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        await update({ name: name.trim() });
        setStep("crew");
      } else {
        const data = await response.json();
        setError(data.error || "이름 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save name:", error);
      setError("이름 저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrewSelect = (crewId: string) => {
    setSelectedCrewId(selectedCrewId === crewId ? null : crewId);
  };

  const handleFinalSubmit = async () => {
    setJoiningCrew(true);
    setError("");

    try {
      // Join selected crew if any
      if (selectedCrewId) {
        const response = await fetch(`/api/crews/${selectedCrewId}/members`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json();
          // If password required, show error but continue
          if (data.error?.includes("비밀번호")) {
            setError("이 크루는 비밀번호가 필요합니다. 나중에 가입해주세요.");
            // Continue to home anyway
          }
        }
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to join crew:", error);
      // Continue to home even if crew join fails
      router.push("/");
      router.refresh();
    } finally {
      setJoiningCrew(false);
    }
  };

  const handleSkip = () => {
    router.push("/");
    router.refresh();
  };

  const filteredCrews = crews.filter(
    (crew) =>
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${step === "name" ? "bg-primary" : "bg-border"}`} />
          <div className={`w-2 h-2 rounded-full ${step === "crew" ? "bg-primary" : "bg-border"}`} />
        </div>

        {/* Name Step */}
        {step === "name" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-5">
                <User className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">프로필 설정</h1>
              <p className="text-text-tertiary text-sm">
                러닝 크루에서 사용할 이름을 입력해주세요
              </p>
            </div>

            <Card className="p-6">
              <form onSubmit={handleNameSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    이름 (닉네임)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    placeholder="예: 홍길동"
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    autoFocus
                  />
                  {error && (
                    <p className="text-error text-sm mt-2">{error}</p>
                  )}
                  <p className="text-text-tertiary text-xs mt-2">
                    이 이름은 크루 멤버들에게 표시됩니다
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "저장 중..." : "다음"}
                  {!isLoading && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </form>
            </Card>
          </>
        )}

        {/* Crew Selection Step */}
        {step === "crew" && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-3xl mb-5">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">크루 가입</h1>
              <p className="text-text-tertiary text-sm">
                함께 달릴 크루를 선택해주세요
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="크루 검색..."
                className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Crew List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
              {isLoadingCrews ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-text-tertiary mt-3 text-sm">크루 불러오는 중...</p>
                </div>
              ) : filteredCrews.length === 0 ? (
                <Card className="text-center py-8">
                  <Users className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">
                    {searchQuery ? "검색 결과가 없습니다" : "가입 가능한 크루가 없습니다"}
                  </p>
                </Card>
              ) : (
                filteredCrews.map((crew) => (
                  <button
                    key={crew.id}
                    type="button"
                    onClick={() => handleCrewSelect(crew.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedCrewId === crew.id
                        ? "bg-primary/10 border-primary"
                        : "bg-surface border-border hover:border-text-tertiary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                        selectedCrewId === crew.id
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-text-secondary"
                      }`}>
                        {crew.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold ${
                          selectedCrewId === crew.id ? "text-primary" : "text-text-primary"
                        }`}>
                          {crew.name}
                        </h3>
                        <p className="text-sm text-text-tertiary">
                          {crew._count.members}명의 멤버
                        </p>
                      </div>
                      {selectedCrewId === crew.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {error && (
              <p className="text-error text-sm text-center mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep("name")}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={joiningCrew}
                className="flex-1"
              >
                {joiningCrew ? "가입 중..." : selectedCrewId ? "크루 가입" : "시작하기"}
              </Button>
            </div>

            {selectedCrewId && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-center text-text-tertiary text-sm hover:text-text-secondary transition-colors mt-3"
              >
                크루 없이 시작하기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
