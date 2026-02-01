"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Crown, LogOut, Trash2, UserPlus, Globe, Lock, X, Settings, Key, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface CrewMember {
  id: string;
  userId: string;
  role: string;
  user: User;
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  password: string | null;
  ownerId: string;
  owner: User;
  members: CrewMember[];
}

interface CrewDetailProps {
  crew: Crew;
  isMember: boolean;
  isOwner: boolean;
  currentUserId?: string;
}

export function CrewDetail({ crew, isMember, isOwner, currentUserId }: CrewDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPublic, setIsPublic] = useState(crew.isPublic);
  const [password, setPassword] = useState(crew.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Join with password
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleJoin = async () => {
    // If crew has password and not already showing modal, show modal
    if (crew.password && !showJoinModal) {
      setShowJoinModal(true);
      return;
    }

    setIsLoading(true);
    setJoinError("");
    try {
      const response = await fetch(`/api/crews/${crew.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: joinPassword }),
      });

      if (response.ok) {
        setShowJoinModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        setJoinError(data.error || "가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to join crew:", error);
      setJoinError("가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("정말 이 크루에서 나가시겠습니까?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/crews/${crew.id}/members`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/crews");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to leave crew:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 크루를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/crews/${crew.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/crews");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete crew:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch(`/api/crews/${crew.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublic,
          password: password.trim() || null,
        }),
      });

      if (response.ok) {
        setShowSettings(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const hasSettingsChanged = isPublic !== crew.isPublic || password !== (crew.password || "");

  const handleRemoveMember = async (memberId: string, memberName: string | null) => {
    if (!confirm(`${memberName || "이 멤버"}님을 크루에서 내보내시겠습니까?`)) return;

    setRemovingMemberId(memberId);
    try {
      const response = await fetch(`/api/crews/${crew.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/crews">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">{crew.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-error hover:bg-error/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center">
          <div className="bg-surface w-full max-w-lg rounded-t-2xl p-5 pb-24 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">크루 설정</h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setIsPublic(crew.isPublic);
                  setPassword(crew.password || "");
                }}
                className="p-2 text-text-tertiary hover:bg-surface-elevated rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Public/Private Setting */}
              <div>
                <span className="text-sm font-medium text-text-secondary">공개 설정</span>
                <p className="text-xs text-text-tertiary mt-1 mb-3">
                  공개 크루는 검색에 노출됩니다
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      isPublic
                        ? "bg-primary/10 border-primary"
                        : "bg-surface-elevated border-border hover:border-text-secondary"
                    }`}
                  >
                    <Globe
                      className={`w-5 h-5 ${
                        isPublic ? "text-primary" : "text-text-tertiary"
                      }`}
                    />
                    <div className="text-left">
                      <p
                        className={`font-medium ${
                          isPublic ? "text-primary" : "text-text-primary"
                        }`}
                      >
                        공개
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      !isPublic
                        ? "bg-primary/10 border-primary"
                        : "bg-surface-elevated border-border hover:border-text-secondary"
                    }`}
                  >
                    <Lock
                      className={`w-5 h-5 ${
                        !isPublic ? "text-primary" : "text-text-tertiary"
                      }`}
                    />
                    <div className="text-left">
                      <p
                        className={`font-medium ${
                          !isPublic ? "text-primary" : "text-text-primary"
                        }`}
                      >
                        비공개
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password Setting */}
              <div>
                <span className="text-sm font-medium text-text-secondary">가입 비밀번호</span>
                <p className="text-xs text-text-tertiary mt-1 mb-3">
                  비밀번호를 설정하면 가입 시 비밀번호를 입력해야 합니다
                </p>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (선택사항)"
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-12 pr-12 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {crew.password && (
                  <p className="text-xs text-text-tertiary mt-2">
                    현재 비밀번호가 설정되어 있습니다. 비우면 비밀번호가 해제됩니다.
                  </p>
                )}
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings || !hasSettingsChanged}
                className="w-full"
              >
                {isSavingSettings ? "저장 중..." : "설정 저장"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Password Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">비밀번호 입력</h2>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinPassword("");
                  setJoinError("");
                }}
                className="p-2 text-text-tertiary hover:bg-surface-elevated rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-4">
              이 크루는 비밀번호가 설정되어 있습니다.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => {
                    setJoinPassword(e.target.value);
                    setJoinError("");
                  }}
                  placeholder="비밀번호 입력"
                  className="w-full bg-surface-elevated border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  autoFocus
                />
              </div>
              {joinError && (
                <p className="text-error text-sm">{joinError}</p>
              )}
              <Button
                onClick={handleJoin}
                disabled={isLoading || !joinPassword}
                className="w-full"
              >
                {isLoading ? "가입 중..." : "가입하기"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Crew Info */}
      <Card className="text-center py-6">
        <div className="w-20 h-20 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
          {crew.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-text-primary">{crew.name}</h2>
        <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
          <p className="text-text-tertiary">
            <Users className="w-4 h-4 inline mr-1" />
            {crew.members.length}명
          </p>
          <span className="text-text-disabled">•</span>
          <p className="text-text-tertiary flex items-center gap-1">
            {crew.isPublic ? (
              <>
                <Globe className="w-4 h-4" />
                공개
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                비공개
              </>
            )}
          </p>
          {crew.password && (
            <>
              <span className="text-text-disabled">•</span>
              <p className="text-text-tertiary flex items-center gap-1">
                <Key className="w-4 h-4" />
                비밀번호
              </p>
            </>
          )}
        </div>
        {crew.description && (
          <p className="text-text-secondary mt-3 px-4">{crew.description}</p>
        )}

        {/* Action Button */}
        <div className="mt-6">
          {!isMember ? (
            <Button onClick={handleJoin} disabled={isLoading}>
              <UserPlus className="w-4 h-4 mr-1" />
              {isLoading ? "가입 중..." : "크루 가입하기"}
            </Button>
          ) : !isOwner ? (
            <Button
              variant="secondary"
              onClick={handleLeave}
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4 mr-1" />
              {isLoading ? "나가는 중..." : "크루 나가기"}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Members */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          멤버 {isOwner && <span className="text-sm font-normal text-text-tertiary">• 멤버를 탭하여 관리</span>}
        </h3>
        <div className="space-y-2">
          {crew.members.map((member) => {
            const isOwnerMember = member.userId === crew.ownerId;
            const canRemove = isOwner && !isOwnerMember;

            return (
              <Card key={member.id} className="flex items-center gap-3">
                {member.user.image ? (
                  <Image
                    src={member.user.image}
                    alt={member.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                    {member.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    {member.user.name || "Unknown"}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {isOwnerMember ? "크루장" : member.role === "admin" ? "관리자" : "멤버"}
                  </p>
                </div>
                {isOwnerMember ? (
                  <Crown className="w-5 h-5 text-warning" />
                ) : canRemove ? (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user.name)}
                    disabled={removingMemberId === member.id}
                    className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {removingMemberId === member.id ? (
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </button>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
