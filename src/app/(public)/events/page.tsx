"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

interface MarathonEvent {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  distance: number;
  courses: string | null;
  isOfficial: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<MarathonEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 올해 앞으로 있는 대회만 필터링
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate.getFullYear() === currentYear;
      })
      .sort((a, b) => {
        return new Date(a.date!).getTime() - new Date(b.date!).getTime();
      });
  }, [events, currentYear]);

  // 월별로 대회가 있는 월 목록
  const availableMonths = useMemo(() => {
    const months = new Set(
      upcomingEvents.map((e) => new Date(e.date!).getMonth() + 1)
    );
    return Array.from(months).sort((a, b) => a - b);
  }, [upcomingEvents]);

  // 월별 필터링된 대회
  const filteredEvents = useMemo(() => {
    if (selectedMonth === null) return upcomingEvents;
    return upcomingEvents.filter(
      (e) => new Date(e.date!).getMonth() + 1 === selectedMonth
    );
  }, [upcomingEvents, selectedMonth]);

  // 월별로 그룹화
  const groupedEvents = useMemo(() => {
    const groups: { [key: number]: MarathonEvent[] } = {};
    filteredEvents.forEach((event) => {
      const month = new Date(event.date!).getMonth() + 1;
      if (!groups[month]) groups[month] = [];
      groups[month].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    const formatted = `${month}월 ${day}일 (${weekday})`;
    return { month, day, weekday, formatted };
  };

  const getDistanceLabel = (distance: number) => {
    if (distance >= 42) return "Full";
    if (distance >= 21) return "Half";
    if (distance >= 10) return "10K";
    if (distance >= 5) return "5K";
    return `${distance}km`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-text-primary">
          {currentYear}년 대회 일정
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          앞으로 있는 마라톤 대회
        </p>
      </header>

      {/* Month Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedMonth(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selectedMonth === null
              ? "bg-primary text-white"
              : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
          }`}
        >
          전체 ({upcomingEvents.length})
        </button>
        {availableMonths.map((month) => {
          const count = upcomingEvents.filter(
            (e) => new Date(e.date!).getMonth() + 1 === month
          ).length;
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedMonth === month
                  ? "bg-primary text-white"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {month}월 ({count})
            </button>
          );
        })}
      </div>

      {/* Event List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-text-tertiary mt-3">불러오는 중...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">
            {selectedMonth
              ? `${selectedMonth}월에 예정된 대회가 없습니다`
              : "올해 예정된 대회가 없습니다"}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([month, monthEvents]) => (
            <section key={month}>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                {month}월
              </h2>
              <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
                {monthEvents.map((event) => {
                  const { formatted } = formatDate(event.date!);
                  const eventDate = new Date(event.date!);
                  return (
                    <Link
                      key={event.id}
                      href={`/records/new?eventId=${event.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-surface-elevated transition-colors"
                    >
                      {/* Left: Circular Date Badge */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-base font-bold text-primary leading-none">
                          {eventDate.getDate()}
                        </span>
                        <span className="text-[10px] text-primary/70 mt-0.5">
                          {["일", "월", "화", "수", "목", "금", "토"][eventDate.getDay()]}
                        </span>
                      </div>

                      {/* Middle: Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {event.isOfficial && (
                            <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                          )}
                          <h3 className="font-medium text-text-primary truncate">
                            {event.name}
                          </h3>
                        </div>
                        <p className="text-sm text-text-tertiary mt-0.5 truncate">
                          {formatted}
                          {event.location && ` · ${event.location}`}
                        </p>
                      </div>

                      {/* Right: Course Badges */}
                      <div className="shrink-0 flex gap-1">
                        {event.courses ? (
                          event.courses.split(",").slice(0, 2).map((course) => (
                            <span
                              key={course}
                              className="text-xs px-2 py-1 bg-surface-elevated rounded-md text-text-secondary font-medium"
                            >
                              {course.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs px-2 py-1 bg-surface-elevated rounded-md text-text-secondary font-medium">
                            {getDistanceLabel(event.distance)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
