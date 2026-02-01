import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecordDetail } from "./record-detail";

type Params = Promise<{ id: string }>;

export default async function RecordPage({ params }: { params: Params }) {
  const session = await auth();
  const { id } = await params;

  const record = await prisma.runningLog.findFirst({
    where: { id, userId: session?.user?.id },
  });

  if (!record) {
    notFound();
  }

  return <RecordDetail record={record} />;
}
