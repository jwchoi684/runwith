"use client";

import { signOut } from "next-auth/react";
import { LogOut, ChevronRight } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center justify-between p-4 rounded-[--radius-lg] hover:bg-surface-elevated transition-colors duration-200"
    >
      <div className="flex items-center gap-3">
        <span className="text-error">
          <LogOut className="w-5 h-5" />
        </span>
        <span className="font-medium text-error">로그아웃</span>
      </div>
      <ChevronRight className="w-5 h-5 text-text-tertiary" />
    </button>
  );
}
