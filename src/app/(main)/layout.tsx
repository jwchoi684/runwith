import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
