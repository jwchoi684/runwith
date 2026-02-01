"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Trophy, ChevronRight, ChevronLeft } from "lucide-react";

type Step = "name" | "records";

interface PersonalBest {
  type: "full" | "half" | "10k";
  hours: string;
  minutes: string;
  seconds: string;
  enabled: boolean;
}

const distanceLabels = {
  full: "풀마라톤 (42.195km)",
  half: "하프마라톤 (21.0975km)",
  "10k": "10K",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([
    { type: "full", hours: "", minutes: "", seconds: "", enabled: false },
    { type: "half", hours: "", minutes: "", seconds: "", enabled: false },
    { type: "10k", hours: "", minutes: "", seconds: "", enabled: false },
  ]);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setError("");
    setStep("records");
  };

  const handlePBToggle = (index: number) => {
    const newPBs = [...personalBests];
    newPBs[index].enabled = !newPBs[index].enabled;
    setPersonalBests(newPBs);
  };

  const handlePBChange = (index: number, field: "hours" | "minutes" | "seconds", value: string) => {
    const newPBs = [...personalBests];
    newPBs[index][field] = value;
    setPersonalBests(newPBs);
  };

  const calculateSeconds = (pb: PersonalBest): number | null => {
    if (!pb.enabled) return null;
    const hours = parseInt(pb.hours) || 0;
    const minutes = parseInt(pb.minutes) || 0;
    const seconds = parseInt(pb.seconds) || 0;
    const total = hours * 3600 + minutes * 60 + seconds;
    return total > 0 ? total : null;
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const pbFull = calculateSeconds(personalBests[0]);
      const pbHalf = calculateSeconds(personalBests[1]);
      const pb10k = calculateSeconds(personalBests[2]);

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          pbFull,
          pbHalf,
          pb10k,
        }),
      });

      if (response.ok) {
        await update({ name: name.trim() });
        router.push("/");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "프로필 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("프로필 저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (step === "name") {
      router.push("/");
    } else {
      handleFinalSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${step === "name" ? "bg-primary" : "bg-border"}`} />
          <div className={`w-2 h-2 rounded-full ${step === "records" ? "bg-primary" : "bg-border"}`} />
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

                <Button type="submit" className="w-full">
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-center text-text-tertiary text-sm hover:text-text-secondary transition-colors"
                >
                  나중에 설정하기
                </button>
              </form>
            </Card>
          </>
        )}

        {/* Records Step */}
        {step === "records" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-warning rounded-3xl mb-5">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">개인 최고 기록</h1>
              <p className="text-text-tertiary text-sm">
                기존 개인 최고 기록이 있다면 입력해주세요
              </p>
            </div>

            <div className="space-y-4">
              {personalBests.map((pb, index) => (
                <Card key={pb.type} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-text-primary">
                      {distanceLabels[pb.type]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePBToggle(index)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pb.enabled ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          pb.enabled ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {pb.enabled && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={pb.hours}
                          onChange={(e) => handlePBChange(index, "hours", e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-center text-text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-text-tertiary text-center mt-1">시간</p>
                      </div>
                      <span className="text-text-tertiary">:</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={pb.minutes}
                          onChange={(e) => handlePBChange(index, "minutes", e.target.value)}
                          placeholder="00"
                          className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-center text-text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-text-tertiary text-center mt-1">분</p>
                      </div>
                      <span className="text-text-tertiary">:</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={pb.seconds}
                          onChange={(e) => handlePBChange(index, "seconds", e.target.value)}
                          placeholder="00"
                          className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-center text-text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-text-tertiary text-center mt-1">초</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {error && (
                <p className="text-error text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
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
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "저장 중..." : "시작하기"}
                </Button>
              </div>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-center text-text-tertiary text-sm hover:text-text-secondary transition-colors"
              >
                기록 없이 시작하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
