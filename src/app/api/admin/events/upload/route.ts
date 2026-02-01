import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// POST /api/admin/events/upload - Upload events from Excel
export async function POST(request: NextRequest) {
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

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    // Process each row
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, unknown>;
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // Extract fields (support both Korean and English column names)
        const name = String(row["대회명"] || row["name"] || "").trim();
        const location = String(row["장소"] || row["location"] || "").trim();
        const region = String(row["지역"] || row["region"] || "domestic").trim().toLowerCase();
        const courses = String(row["코스"] || row["courses"] || "").trim();
        const dateValue = row["날짜"] || row["date"];
        const isOfficialValue = row["공식"] || row["isOfficial"];

        if (!name) {
          results.failed++;
          results.errors.push(`행 ${rowNum}: 대회명이 없습니다`);
          continue;
        }

        // Parse date
        let eventDate: Date | null = null;
        if (dateValue) {
          if (typeof dateValue === "number") {
            // Excel serial date
            eventDate = XLSX.SSF.parse_date_code(dateValue) as unknown as Date;
            if (eventDate && typeof eventDate === "object" && "y" in eventDate) {
              const d = eventDate as { y: number; m: number; d: number };
              eventDate = new Date(d.y, d.m - 1, d.d);
            }
          } else if (typeof dateValue === "string") {
            eventDate = new Date(dateValue);
          }

          if (eventDate && isNaN(eventDate.getTime())) {
            eventDate = null;
          }
        }

        // Parse isOfficial
        let isOfficial = true;
        if (isOfficialValue !== undefined) {
          if (typeof isOfficialValue === "boolean") {
            isOfficial = isOfficialValue;
          } else if (typeof isOfficialValue === "string") {
            isOfficial = ["true", "yes", "y", "1", "공식", "o"].includes(
              isOfficialValue.toLowerCase()
            );
          } else if (typeof isOfficialValue === "number") {
            isOfficial = isOfficialValue === 1;
          }
        }

        // Check for duplicate
        const existing = await prisma.marathonEvent.findFirst({
          where: {
            name,
            location: location || null,
          },
        });

        if (existing) {
          results.failed++;
          results.errors.push(`행 ${rowNum}: "${name}" 대회가 이미 존재합니다`);
          continue;
        }

        // Create event
        await prisma.marathonEvent.create({
          data: {
            name,
            location: location || null,
            region: region === "international" || region === "해외" ? "international" : "domestic",
            distance: 0, // Will be inferred from courses
            courses: courses || null,
            date: eventDate,
            isOfficial,
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`행 ${rowNum}: 처리 중 오류 발생`);
        console.error(`Row ${rowNum} error:`, error);
      }
    }

    return NextResponse.json({
      message: `${results.success}개 성공, ${results.failed}개 실패`,
      ...results,
    });
  } catch (error) {
    console.error("Excel upload error:", error);
    return NextResponse.json(
      { error: "Failed to process Excel file" },
      { status: 500 }
    );
  }
}
