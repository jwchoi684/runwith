"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Lock, Key, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function NewCrewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/crews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const crew = await response.json();
        router.push(`/crews/${crew.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create crew:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center gap-3 pt-2">
        <Link href="/crews">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">새 크루 만들기</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">크루 이름</span>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="ex) 서울 러너스"
              className="mt-2 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              required
              maxLength={50}
            />
          </label>
        </Card>

        {/* Description */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">소개</span>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="크루를 소개해주세요"
              rows={3}
              className="mt-2 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              maxLength={200}
            />
          </label>
        </Card>

        {/* Visibility */}
        <Card>
          <span className="text-sm font-medium text-text-secondary">공개 설정</span>
          <p className="text-xs text-text-tertiary mt-1 mb-3">
            공개 크루는 검색에 노출됩니다
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: true })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all ${
                formData.isPublic
                  ? "bg-primary/10 border-primary"
                  : "bg-surface-elevated border-border hover:border-text-secondary"
              }`}
            >
              <Globe
                className={`w-5 h-5 ${
                  formData.isPublic ? "text-primary" : "text-text-tertiary"
                }`}
              />
              <div className="text-left">
                <p
                  className={`font-medium ${
                    formData.isPublic ? "text-primary" : "text-text-primary"
                  }`}
                >
                  공개
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: false })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all ${
                !formData.isPublic
                  ? "bg-primary/10 border-primary"
                  : "bg-surface-elevated border-border hover:border-text-secondary"
              }`}
            >
              <Lock
                className={`w-5 h-5 ${
                  !formData.isPublic ? "text-primary" : "text-text-tertiary"
                }`}
              />
              <div className="text-left">
                <p
                  className={`font-medium ${
                    !formData.isPublic ? "text-primary" : "text-text-primary"
                  }`}
                >
                  비공개
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* Password */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">가입 비밀번호</span>
            <p className="text-xs text-text-tertiary mt-1 mb-2">
              비밀번호를 설정하면 가입 시 비밀번호를 입력해야 합니다
            </p>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="비밀번호 (선택사항)"
                className="w-full bg-surface-elevated border border-border rounded-lg pl-12 pr-12 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={50}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </label>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading || !formData.name}
          className="w-full"
        >
          {isLoading ? "만드는 중..." : "크루 만들기"}
        </Button>
      </form>
    </div>
  );
}
