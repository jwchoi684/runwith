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

  // Calculate DAU (users who created records today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dau = await prisma.runningLog.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: today,
      },
    },
  });

  // Calculate MAU (users who created records this month)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const mau = await prisma.runningLog.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: monthStart,
      },
    },
  });

  // Fetch stats
  const stats = {
    totalUsers: await prisma.user.count(),
    totalRecords: await prisma.runningLog.count(),
    totalCrews: await prisma.crew.count(),
    totalEvents: await prisma.marathonEvent.count(),
    dau: dau.length,
    mau: mau.length,
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

  // Fetch API logs (최근 100개)
  const apiLogs = await prisma.apiLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
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

  // Calculate API call statistics (top APIs)
  const apiStatsRaw = await prisma.apiLog.groupBy({
    by: ["path", "method"],
    _count: { id: true },
    _avg: { duration: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const apiStats = apiStatsRaw.map((stat) => ({
    path: stat.path,
    method: stat.method,
    count: stat._count.id,
    avgDuration: stat._avg.duration ? Math.round(stat._avg.duration) : null,
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
      apiLogs={apiLogs}
      pageStats={pageStats}
      apiStats={apiStats}
      currentUserId={session.user.id}
    />
  );
}
