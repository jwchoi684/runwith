"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bell,
  Lock,
  Eye,
  Moon,
  Globe,
  Trash2,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    crewActivity: true,
    newRecords: true,
    weeklyReport: false,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showRecords: true,
  });

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
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

      {/* Notifications */}
      <section>
        <h2 className="text-sm font-medium text-text-tertiary mb-3 px-1">알림</h2>
        <Card className="divide-y divide-border">
          <SettingToggle
            icon={<Bell className="w-5 h-5" />}
            label="크루 활동 알림"
            description="크루 멤버의 새 기록 알림"
            checked={notifications.crewActivity}
            onChange={(checked) =>
              setNotifications({ ...notifications, crewActivity: checked })
            }
          />
          <SettingToggle
            icon={<Bell className="w-5 h-5" />}
            label="기록 달성 알림"
            description="새 기록 달성 시 알림"
            checked={notifications.newRecords}
            onChange={(checked) =>
              setNotifications({ ...notifications, newRecords: checked })
            }
          />
          <SettingToggle
            icon={<Bell className="w-5 h-5" />}
            label="주간 리포트"
            description="매주 러닝 통계 요약"
            checked={notifications.weeklyReport}
            onChange={(checked) =>
              setNotifications({ ...notifications, weeklyReport: checked })
            }
          />
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
            checked={privacy.publicProfile}
            onChange={(checked) =>
              setPrivacy({ ...privacy, publicProfile: checked })
            }
          />
          <SettingToggle
            icon={<Lock className="w-5 h-5" />}
            label="기록 공개"
            description="크루원에게 러닝 기록 공개"
            checked={privacy.showRecords}
            onChange={(checked) =>
              setPrivacy({ ...privacy, showRecords: checked })
            }
          />
        </Card>
      </section>

      {/* App Settings */}
      <section>
        <h2 className="text-sm font-medium text-text-tertiary mb-3 px-1">앱 설정</h2>
        <Card className="divide-y divide-border">
          <SettingItem
            icon={<Moon className="w-5 h-5" />}
            label="다크 모드"
            value="시스템 설정"
          />
          <SettingItem
            icon={<Globe className="w-5 h-5" />}
            label="언어"
            value="한국어"
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
          <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-elevated transition-colors">
            <Trash2 className="w-5 h-5 text-error" />
            <span className="font-medium text-error">계정 삭제</span>
          </button>
        </Card>
      </section>

      {/* App Info */}
      <div className="text-center pt-4 pb-8">
        <p className="text-text-tertiary text-sm">Running Crew v1.0.0</p>
        <p className="text-text-tertiary text-xs mt-1">Made with ❤️ for runners</p>
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

function SettingItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <span className="text-text-tertiary">{icon}</span>
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      <span className="text-text-tertiary text-sm">{value}</span>
    </div>
  );
}
