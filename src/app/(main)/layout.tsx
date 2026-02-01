import { auth, needsOnboarding } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AccessLogger } from "@/components/access-logger";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if new user needs to complete onboarding
  const shouldOnboard = await needsOnboarding(session.user.id);
  if (shouldOnboard) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen pb-20">
      <AccessLogger />
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
