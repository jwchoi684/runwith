import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav isLoggedIn={!!session?.user} />
    </div>
  );
}
