"use client";

import { Home, Trophy, Calendar, Medal, User, LogIn, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// Nav items for logged-in users
const authNavItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/records", icon: Trophy, label: "기록" },
  { href: "/events", icon: Calendar, label: "대회" },
  { href: "/leaderboard", icon: Medal, label: "리더보드" },
  { href: "/profile", icon: User, label: "프로필" },
];

// Nav items for non-logged-in users
const publicNavItems = [
  { href: "/events", icon: Calendar, label: "대회" },
  { href: "/pace-chart", icon: Timer, label: "페이스" },
  { href: "/login", icon: LogIn, label: "로그인" },
];

interface BottomNavProps {
  isLoggedIn?: boolean;
}

export function BottomNav({ isLoggedIn = true }: BottomNavProps) {
  const pathname = usePathname();

  const visibleItems = isLoggedIn ? authNavItems : publicNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              <motion.div
                className="flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <Icon
                  size={24}
                  className={
                    isActive ? "text-primary" : "text-text-tertiary"
                  }
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "text-primary" : "text-text-tertiary"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
