import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all users with their accounts (for login provider)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      lastAccessedAt: true,
      accounts: {
        select: { provider: true },
      },
      _count: {
        select: {
          runningLogs: true,
          crews: true,
          ownedCrews: true,
        },
      },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate DAU trend (last 30 days) - based on access logs
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dauTrendRaw = await prisma.accessLog.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    _min: { createdAt: true },
  });

  // Group by date for DAU trend
  const dauByDate: Record<string, Set<string>> = {};
  const accessLogsForDau = await prisma.accessLog.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { userId: true, createdAt: true },
  });

  accessLogsForDau.forEach((log) => {
    const dateKey = log.createdAt.toISOString().split("T")[0];
    if (!dauByDate[dateKey]) dauByDate[dateKey] = new Set();
    dauByDate[dateKey].add(log.userId);
  });

  const dauTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    dauTrend.push({
      date: dateKey,
      count: dauByDate[dateKey]?.size || 0,
    });
  }

  // Calculate MAU trend (last 12 months)
  const mauTrend = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59);

    const monthUsers = await prisma.accessLog.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: monthDate,
          lte: monthEnd,
        },
      },
    });

    mauTrend.push({
      month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      label: `${monthDate.getMonth() + 1}월`,
      count: monthUsers.length,
    });
  }

  // Fetch stats
  const stats = {
    totalUsers: await prisma.user.count(),
    totalRecords: await prisma.runningLog.count(),
    totalCrews: await prisma.crew.count(),
    totalEvents: await prisma.marathonEvent.count(),
  };

  // Fetch all records (more for admin view)
  const recentRecords = await prisma.runningLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      event: {
        select: { name: true },
      },
    },
  });

  // Fetch all crews with members
  const crews = await prisma.crew.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  // Fetch all events (날짜 내림차순)
  const events = await prisma.marathonEvent.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { runningLogs: true },
      },
    },
  });

  // Fetch ranking data (aggregate by user)
  const rankingData = await prisma.runningLog.groupBy({
    by: ["userId"],
    _sum: {
      distance: true,
      duration: true,
    },
    _count: {
      id: true,
    },
  });

  // Map ranking data with user info
  const rankings = rankingData.map((rank) => {
    const user = users.find((u) => u.id === rank.userId);
    return {
      userId: rank.userId,
      userName: user?.name || "Unknown",
      userEmail: user?.email || "",
      userImage: user?.image || null,
      totalDistance: rank._sum.distance || 0,
      totalDuration: rank._sum.duration || 0,
      totalRuns: rank._count.id,
    };
  }).sort((a, b) => b.totalDistance - a.totalDistance);

  // Get crew members for filtering
  const crewMembers = await prisma.crewMember.findMany({
    select: {
      userId: true,
      crewId: true,
    },
  });

  // Fetch pace groups
  const paceGroups = await prisma.paceGroup.findMany({
    orderBy: { groupNumber: "asc" },
  });

  // Fetch access logs (최근 100개)
  const accessLogs = await prisma.accessLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  // Calculate page view statistics (top pages)
  const pageStatsRaw = await prisma.accessLog.groupBy({
    by: ["path"],
    where: {
      action: "page_view",
      path: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const pageStats = pageStatsRaw.map((stat) => ({
    path: stat.path || "/",
    count: stat._count.id,
  }));

  return (
    <AdminDashboard
      users={users}
      stats={stats}
      recentRecords={recentRecords}
      crews={crews}
      events={events}
      rankings={rankings}
      crewMembers={crewMembers}
      paceGroups={paceGroups}
      accessLogs={accessLogs}
      pageStats={pageStats}
      dauTrend={dauTrend}
      mauTrend={mauTrend}
      currentUserId={session.user.id}
    />
  );
}
