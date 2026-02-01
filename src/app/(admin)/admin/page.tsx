import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          runningLogs: true,
          crews: true,
          ownedCrews: true,
        },
      },
    },
  });

  // Fetch stats
  const stats = {
    totalUsers: await prisma.user.count(),
    totalRecords: await prisma.runningLog.count(),
    totalCrews: await prisma.crew.count(),
    totalEvents: await prisma.marathonEvent.count(),
  };

  // Fetch recent records
  const recentRecords = await prisma.runningLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
      event: {
        select: { name: true },
      },
    },
  });

  // Fetch all crews
  const crews = await prisma.crew.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { name: true, email: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  return (
    <AdminDashboard
      users={users}
      stats={stats}
      recentRecords={recentRecords}
      crews={crews}
      currentUserId={session.user.id}
    />
  );
}
