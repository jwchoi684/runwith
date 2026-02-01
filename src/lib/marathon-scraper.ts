import * as iconv from "iconv-lite";

interface ScrapedEvent {
  name: string;
  date: string; // YYYY-MM-DD format
  location: string;
  courses: string[]; // ["Full", "Half", "10km", "5km"]
  externalId: string;
}

function parseCourses(courseStr: string): string[] {
  const courses: string[] = [];
  const normalized = courseStr.toLowerCase();

  if (normalized.includes("풀") || normalized.includes("full") || normalized.includes("42")) {
    courses.push("Full");
  }
  if (normalized.includes("하프") || normalized.includes("half") || normalized.includes("21")) {
    courses.push("Half");
  }
  if (normalized.includes("10km") || normalized.includes("10k")) {
    courses.push("10km");
  }
  if (normalized.includes("5km") || normalized.includes("5k")) {
    courses.push("5km");
  }

  // If no standard courses found, try to extract the raw course info
  if (courses.length === 0 && courseStr.trim()) {
    courses.push(courseStr.trim());
  }

  return courses;
}

function getDistanceFromCourses(courses: string[]): number {
  // Return the longest distance
  if (courses.includes("Full")) return 42.195;
  if (courses.includes("Half")) return 21.0975;
  if (courses.includes("10km")) return 10;
  if (courses.includes("5km")) return 5;
  return 10; // Default
}

export async function scrapeMarathonSchedule(year: number = new Date().getFullYear()): Promise<ScrapedEvent[]> {
  try {
    const url = `http://www.roadrun.co.kr/schedule/list.php?syear_key=${year}`;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Convert from EUC-KR to UTF-8
    const html = iconv.decode(Buffer.from(buffer), "euc-kr");

    const events: ScrapedEvent[] = [];

    // Extract event data by parsing HTML sections
    // Split by event rows (each row starts with date pattern)
    const datePattern = /<font size="4" face="Arial[^"]*">(\d{1,2})\/(\d{1,2})<\/font>/g;
    const eventPattern = /view\.php\?no=(\d+)[^>]*>([^<]+)<\/a>(?:<br>)?(?:<font size="2" color="#990000">)?([^<]*)/;
    const locationPattern = /<div align="right" valign="bottom">([^<]+)<br>/;

    // Find all date positions
    const dateMatches: Array<{ month: string; day: string; index: number }> = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(html)) !== null) {
      dateMatches.push({
        month: dateMatch[1],
        day: dateMatch[2],
        index: dateMatch.index,
      });
    }

    // For each date, find the event info following it
    for (let i = 0; i < dateMatches.length; i++) {
      const currentDate = dateMatches[i];
      const nextIndex = i < dateMatches.length - 1 ? dateMatches[i + 1].index : html.length;
      const section = html.substring(currentDate.index, nextIndex);

      const eventMatch = section.match(eventPattern);
      if (!eventMatch) continue;

      const [, externalId, name, courseStr] = eventMatch;
      const locationMatch = section.match(locationPattern);
      const location = locationMatch ? locationMatch[1].trim() : "";

      const courses = parseCourses(courseStr || "");
      const dateStr = `${year}-${currentDate.month.padStart(2, "0")}-${currentDate.day.padStart(2, "0")}`;

      // Skip cancelled events
      if (name.includes("취소")) continue;

      events.push({
        name: name.trim(),
        date: dateStr,
        location: location || "",
        courses,
        externalId,
      });
    }

    return events;
  } catch (error) {
    console.error("Failed to scrape marathon schedule:", error);
    throw error;
  }
}

export function convertToMarathonEvent(event: ScrapedEvent) {
  return {
    name: event.name,
    location: event.location || null,
    distance: getDistanceFromCourses(event.courses),
    courses: event.courses.join(","),
    date: new Date(event.date),
    externalId: event.externalId,
    isOfficial: true,
  };
}
