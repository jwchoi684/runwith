"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lock,
  Eye,
  Trash2,
  LogOut,
  User,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isPublicProfile: boolean;
  isPublicRecords: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setNewName(data.name || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      setError("이름을 입력해주세요");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditingName(false);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "저장에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to save name:", error);
      setError("저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNewName(profile?.name || "");
    setIsEditingName(false);
    setError("");
  };

  const handlePrivacyChange = async (field: "isPublicProfile" | "isPublicRecords", value: boolean) => {
    if (!profile) return;

    // Optimistic update
    setProfile({ ...profile, [field]: value });

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        // Revert on failure
        setProfile({ ...profile, [field]: !value });
        console.error("Failed to update privacy setting");
      }
    } catch (error) {
      // Revert on failure
      setProfile({ ...profile, [field]: !value });
      console.error("Failed to update privacy setting:", error);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        // 계정 삭제 성공 - 로그아웃
        await signOut({ callbackUrl: "/login" });
      } else {
        const data = await response.json();
        setDeleteError(data.error || "계정 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteError("계정 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3 pt-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">설정</h1>
      </header>

      {/* Profile Section */}
      <section>
        <h2 className="text-sm font-medium text-text-tertiary mb-3 px-1">프로필</h2>
        <Card className="divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary">
                  <User className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary mb-1">이름</p>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="이름 입력"
                        autoFocus
                        maxLength={50}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSaving}
                        className="p-2 text-success hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-text-tertiary hover:bg-surface-elevated rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-text-primary">
                      {profile?.name || "이름 없음"}
                    </p>
                  )}
                  {error && (
                    <p className="text-xs text-error mt-1">{error}</p>
                  )}
                </div>
              </div>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 text-text-tertiary hover:bg-surface-elevated rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-text-tertiary">@</span>
              <div>
                <p className="text-xs text-text-tertiary mb-1">이메일</p>
                <p className="font-medium text-text-primary">
                  {profile?.email || "-"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Privacy */}
      <section>
        <h2 className="text-sm font-medium text-text-tertiary mb-3 px-1">개인정보</h2>
        <Card className="divide-y divide-border">
          <SettingToggle
            icon={<Eye className="w-5 h-5" />}
            label="공개 프로필"
            description="다른 사용자가 프로필 조회 가능"
            checked={profile?.isPublicProfile ?? true}
            onChange={(checked) => handlePrivacyChange("isPublicProfile", checked)}
          />
          <SettingToggle
            icon={<Lock className="w-5 h-5" />}
            label="기록 공개"
            description="크루원에게 러닝 기록 공개"
            checked={profile?.isPublicRecords ?? true}
            onChange={(checked) => handlePrivacyChange("isPublicRecords", checked)}
          />
        </Card>
      </section>

      {/* Account */}
      <section>
        <h2 className="text-sm font-medium text-text-tertiary mb-3 px-1">계정</h2>
        <Card className="divide-y divide-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-elevated transition-colors"
          >
            <LogOut className="w-5 h-5 text-text-tertiary" />
            <span className="font-medium text-text-primary">로그아웃</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-elevated transition-colors"
          >
            <Trash2 className="w-5 h-5 text-error" />
            <span className="font-medium text-error">계정 삭제</span>
          </button>
        </Card>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">계정을 삭제하시겠습니까?</h3>
              <p className="text-text-secondary text-sm">
                계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            {deleteError && (
              <p className="text-error text-sm text-center mb-4">{deleteError}</p>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full bg-error hover:bg-error/90"
              >
                {isDeleting ? "삭제 중..." : "계정 삭제"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError("");
                }}
                disabled={isDeleting}
                className="w-full"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      <div className="text-center pt-4 pb-8">
        <p className="text-text-tertiary text-sm">Running Crew v1.0.0</p>
      </div>
    </div>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <span className="text-text-tertiary">{icon}</span>
        <div>
          <p className="font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-tertiary">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
