import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { scrapeMarathonSchedule, convertToMarathonEvent } from "@/lib/marathon-scraper";

// GET /api/admin/events/import - Preview events to import
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const scrapedEvents = await scrapeMarathonSchedule(year);

    // Check which events already exist
    const existingExternalIds = await prisma.marathonEvent.findMany({
      where: {
        externalId: {
          in: scrapedEvents.map((e) => e.externalId),
        },
      },
      select: { externalId: true },
    });

    const existingIdSet = new Set(existingExternalIds.map((e) => e.externalId));

    const eventsWithStatus = scrapedEvents.map((event) => ({
      ...event,
      alreadyExists: existingIdSet.has(event.externalId),
    }));

    return NextResponse.json({
      events: eventsWithStatus,
      total: eventsWithStatus.length,
      newCount: eventsWithStatus.filter((e) => !e.alreadyExists).length,
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch marathon schedule" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events/import - Import selected events
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "No events provided" },
        { status: 400 }
      );
    }

    // Convert events and filter out existing ones
    const existingExternalIds = await prisma.marathonEvent.findMany({
      where: {
        externalId: {
          in: events.map((e: { externalId: string }) => e.externalId),
        },
      },
      select: { externalId: true },
    });

    const existingIdSet = new Set(existingExternalIds.map((e) => e.externalId));

    const newEvents = events
      .filter((e: { externalId: string }) => !existingIdSet.has(e.externalId))
      .map(convertToMarathonEvent);

    if (newEvents.length === 0) {
      return NextResponse.json({
        success: true,
        importedCount: 0,
        message: "All events already exist",
      });
    }

    // Bulk create events
    const result = await prisma.marathonEvent.createMany({
      data: newEvents,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      importedCount: result.count,
    });
  } catch (error) {
    console.error("Failed to import events:", error);
    return NextResponse.json(
      { error: "Failed to import events" },
      { status: 500 }
    );
  }
}
