"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy, X, Check, Star, Plus } from "lucide-react";

interface MarathonEvent {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  distance: number;
  courses: string | null;
  isOfficial: boolean;
}

interface UserEvent {
  id: string;
  eventId: string;
  course: string | null;
  event: MarathonEvent;
}

export default function EventsPage() {
  const [events, setEvents] = useState<MarathonEvent[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MarathonEvent | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchEvents();
    fetchUserEvents();
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

  const fetchUserEvents = async () => {
    try {
      const response = await fetch("/api/user-events");
      if (response.ok) {
        const data = await response.json();
        setUserEvents(data);
        setIsLoggedIn(true);
      } else if (response.status === 401) {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Failed to fetch user events:", error);
    }
  };

  const userEventIds = useMemo(() => {
    return new Set(userEvents.map((ue) => ue.eventId));
  }, [userEvents]);

  const getUserEvent = (eventId: string) => {
    return userEvents.find((ue) => ue.eventId === eventId);
  };

  const handleRegister = async () => {
    if (!selectedEvent) return;

    setIsRegistering(true);
    try {
      const response = await fetch("/api/user-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          course: selectedCourse || null,
        }),
      });

      if (response.ok) {
        const newUserEvent = await response.json();
        setUserEvents([...userEvents, newUserEvent]);
        setSelectedEvent(null);
        setSelectedCourse("");
      } else if (response.status === 401) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Failed to register:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      const response = await fetch(`/api/user-events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUserEvents(userEvents.filter((ue) => ue.eventId !== eventId));
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Failed to unregister:", error);
    }
  };

  const handleAddRecord = (eventId: string) => {
    window.location.href = `/records/new?eventId=${eventId}`;
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

  // 내 대회 필터링
  const myUpcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return userEvents
      .filter((ue) => {
        if (!ue.event.date) return false;
        const eventDate = new Date(ue.event.date);
        return eventDate >= today;
      })
      .sort((a, b) => {
        return new Date(a.event.date!).getTime() - new Date(b.event.date!).getTime();
      });
  }, [userEvents]);

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

  const getCourses = (event: MarathonEvent) => {
    if (event.courses) {
      return event.courses.split(",").map((c) => c.trim());
    }
    return [getDistanceLabel(event.distance)];
  };

  const renderEventCard = (event: MarathonEvent, userEvent?: UserEvent) => {
    const { formatted } = formatDate(event.date!);
    const eventDate = new Date(event.date!);
    const isRegistered = userEventIds.has(event.id);

    return (
      <button
        key={event.id}
        onClick={() => {
          setSelectedEvent(event);
          if (userEvent?.course) {
            setSelectedCourse(userEvent.course);
          } else {
            setSelectedCourse("");
          }
        }}
        className="w-full text-left p-4 hover:bg-surface-elevated transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Left: Circular Date Badge */}
          <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 ${
            isRegistered ? "bg-green-500/20" : "bg-primary/10"
          }`}>
            <span className={`text-base font-bold leading-none ${
              isRegistered ? "text-green-500" : "text-primary"
            }`}>
              {eventDate.getDate()}
            </span>
            <span className={`text-[10px] mt-0.5 ${
              isRegistered ? "text-green-500/70" : "text-primary/70"
            }`}>
              {["일", "월", "화", "수", "목", "금", "토"][eventDate.getDay()]}
            </span>
          </div>

          {/* Right: Event Info */}
          <div className="flex-1 min-w-0">
            {/* Event Name - full width, no overlap */}
            <div className="flex items-start gap-1.5 mb-1">
              {isRegistered && (
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              )}
              {event.isOfficial && !isRegistered && (
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              )}
              <h3 className="font-medium text-text-primary leading-snug break-words">
                {event.name}
              </h3>
            </div>

            {/* Date */}
            <p className="text-sm text-text-tertiary">{formatted}</p>

            {/* Location */}
            {event.location && (
              <p className="text-sm text-text-tertiary flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="break-words">{event.location}</span>
              </p>
            )}

            {/* Course Badges - clearly below all text */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {getCourses(event).map((course) => (
                <span
                  key={course}
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    userEvent?.course === course
                      ? "bg-green-500/20 text-green-500"
                      : "bg-surface-elevated text-text-secondary"
                  }`}
                >
                  {course}
                </span>
              ))}
            </div>
          </div>
        </div>
      </button>
    );
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

      {/* Tab Navigation */}
      {isLoggedIn && (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "all"
                ? "bg-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
            }`}
          >
            전체 대회
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "my"
                ? "bg-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
            }`}
          >
            <Star className="w-4 h-4" />
            내 대회 ({myUpcomingEvents.length})
          </button>
        </div>
      )}

      {/* All Events Tab */}
      {activeTab === "all" && (
        <>
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
                      const userEvent = getUserEvent(event.id);
                      return renderEventCard(event, userEvent);
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Events Tab */}
      {activeTab === "my" && (
        <>
          {myUpcomingEvents.length === 0 ? (
            <Card className="text-center py-12">
              <Star className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">참가 확정한 대회가 없습니다</p>
              <p className="text-sm text-text-tertiary mt-1">
                전체 대회에서 참가할 대회를 선택하세요
              </p>
            </Card>
          ) : (
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
              {myUpcomingEvents.map((userEvent) =>
                renderEventCard(userEvent.event, userEvent)
              )}
            </div>
          )}
        </>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60]">
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 pb-24 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                  {selectedEvent.isOfficial && (
                    <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                  )}
                  <h2 className="text-xl font-bold text-text-primary">
                    {selectedEvent.name}
                  </h2>
                </div>
                {selectedEvent.date && (
                  <p className="text-text-secondary mt-1">
                    {new Date(selectedEvent.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </p>
                )}
                {selectedEvent.location && (
                  <p className="text-text-tertiary flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setSelectedCourse("");
                }}
                className="text-text-tertiary hover:text-text-primary p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Registered Status */}
            {userEventIds.has(selectedEvent.id) ? (
              <>
                {/* Already registered */}
                <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 rounded-xl mb-4">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-500">참가 확정됨</span>
                  {getUserEvent(selectedEvent.id)?.course && (
                    <span className="text-green-500/70">
                      ({getUserEvent(selectedEvent.id)?.course})
                    </span>
                  )}
                </div>

                {/* Action Buttons for Registered */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleAddRecord(selectedEvent.id)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    기록 추가
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleUnregister(selectedEvent.id)}
                    className="w-full text-red-500 hover:bg-red-500/10"
                  >
                    참가 취소
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Not registered - Course Selection */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-text-secondary mb-2">
                    참가 종목 선택
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getCourses(selectedEvent).map((course) => (
                      <button
                        key={course}
                        onClick={() => setSelectedCourse(course)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCourse === course
                            ? "bg-primary text-white"
                            : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
                        }`}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  onClick={handleRegister}
                  disabled={isRegistering || !selectedCourse}
                  className="w-full"
                >
                  {isRegistering ? "등록 중..." : "참가 확정"}
                </Button>

                {!isLoggedIn && (
                  <p className="text-sm text-text-tertiary text-center mt-3">
                    참가 확정하려면{" "}
                    <a href="/login" className="text-primary underline">
                      로그인
                    </a>
                    이 필요합니다
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
