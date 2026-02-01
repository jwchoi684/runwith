import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all users with their accounts (for login provider)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
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

  // Fetch all events
  const events = await prisma.marathonEvent.findMany({
    orderBy: { createdAt: "desc" },
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

  return (
    <AdminDashboard
      users={users}
      stats={stats}
      recentRecords={recentRecords}
      crews={crews}
      events={events}
      rankings={rankings}
      crewMembers={crewMembers}
      currentUserId={session.user.id}
    />
  );
}
