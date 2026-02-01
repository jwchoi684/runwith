import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// GET /api/admin/events/template - Download Excel template
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if current user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  // Create template data
  const templateData = [
    {
      "대회명": "2026 서울마라톤",
      "장소": "서울",
      "지역": "국내",
      "코스": "Full,Half,10K",
      "날짜": "2026-03-15",
      "공식": "O",
    },
    {
      "대회명": "2026 보스턴 마라톤",
      "장소": "보스턴",
      "지역": "해외",
      "코스": "Full",
      "날짜": "2026-04-20",
      "공식": "O",
    },
    {
      "대회명": "예시 대회 (삭제하세요)",
      "장소": "장소 입력",
      "지역": "국내 또는 해외",
      "코스": "Full,Half,10K,5K 중 선택 (쉼표 구분)",
      "날짜": "YYYY-MM-DD 형식",
      "공식": "O 또는 X",
    },
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 25 }, // 대회명
    { wch: 15 }, // 장소
    { wch: 12 }, // 지역
    { wch: 25 }, // 코스
    { wch: 15 }, // 날짜
    { wch: 8 },  // 공식
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "대회목록");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Return as downloadable file
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=marathon_events_template.xlsx",
    },
  });
}
