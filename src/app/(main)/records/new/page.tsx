"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cloud, Sun, CloudRain, Snowflake, ChevronDown, MapPin, Search, Plus, X, Calendar } from "lucide-react";
import Link from "next/link";

interface MarathonEvent {
  id: string;
  name: string;
  location: string | null;
  distance: number;
  date: string | null;
}

const weatherOptions = [
  { value: "sunny", icon: Sun, label: "맑음" },
  { value: "cloudy", icon: Cloud, label: "흐림" },
  { value: "rainy", icon: CloudRain, label: "비" },
  { value: "snowy", icon: Snowflake, label: "눈" },
];

const feelingOptions = [
  { value: 1, emoji: "😫", label: "힘듦" },
  { value: 2, emoji: "😓", label: "어려움" },
  { value: 3, emoji: "😐", label: "보통" },
  { value: 4, emoji: "😊", label: "좋음" },
  { value: 5, emoji: "🤩", label: "최고" },
];

const distancePresets = [
  { label: "5K", value: "5" },
  { label: "10K", value: "10" },
  { label: "Half", value: "21.0975" },
  { label: "Full", value: "42.195" },
];

export default function NewRecordPage() {
  const router = useRouter();
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<MarathonEvent[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    distance: "42.195",
  });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // 연도/월 필터 상태 (기본값: 현재 연도, 현재 월)
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth() + 1);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    distance: "",
    hours: "",
    minutes: "",
    seconds: "",
    notes: "",
    weather: "",
    feeling: 0,
    eventId: "",
    eventName: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
        setEventSearchQuery("");
      }
    };

    if (showEventDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEventDropdown]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);

        // Seed events if empty
        if (data.length === 0) {
          await fetch("/api/events/seed", { method: "POST" });
          const seededResponse = await fetch("/api/events");
          if (seededResponse.ok) {
            setEvents(await seededResponse.json());
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  // 대회가 있는 연도 목록 추출
  const availableYears = useMemo(() => {
    const years = new Set(
      events
        .filter(e => e.date)
        .map(e => new Date(e.date!).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a); // 최신 연도 먼저
  }, [events]);

  // 선택된 연도에서 대회가 있는 월 목록 추출
  const availableMonths = useMemo(() => {
    const months = new Set(
      events
        .filter(e => e.date && new Date(e.date).getFullYear() === selectedYear)
        .map(e => new Date(e.date!).getMonth() + 1)
    );
    return Array.from(months).sort((a, b) => a - b);
  }, [events, selectedYear]);

  // 연도/월/검색어로 필터링된 대회 목록
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (!event.date) return false;

      const eventDate = new Date(event.date);
      const matchesYear = eventDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === null || eventDate.getMonth() + 1 === selectedMonth;
      const matchesSearch = eventSearchQuery === "" ||
        event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(eventSearchQuery.toLowerCase()));

      return matchesYear && matchesMonth && matchesSearch;
    }).sort((a, b) => {
      // 날짜순 정렬
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });
  }, [events, selectedYear, selectedMonth, eventSearchQuery]);

  // 연도 변경 시 해당 연도의 첫 번째 월로 자동 선택
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonth !== null) {
      // 현재 선택된 월이 해당 연도에 없으면 첫 번째 월로 변경
      if (!availableMonths.includes(selectedMonth)) {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [selectedYear, availableMonths, selectedMonth]);

  const handleEventSelect = (event: MarathonEvent) => {
    // 대회명과 날짜를 함께 표시
    const displayName = event.date
      ? `${event.name} (${new Date(event.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })})`
      : event.name;

    setFormData({
      ...formData,
      eventId: event.id,
      eventName: displayName,
      // 거리는 자동 설정하지 않음 - 사용자가 직접 선택 (풀/하프/10K 등)
      date: event.date || formData.date,
    });
    setShowEventDropdown(false);
    setEventSearchQuery("");
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim()) return;

    setIsCreatingEvent(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEvent.name.trim(),
          distance: newEvent.distance,
          date: newEvent.date,
        }),
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setEvents([createdEvent, ...events]);
        handleEventSelect(createdEvent);
        setShowAddEvent(false);
        setNewEvent({
          name: "",
          date: new Date().toISOString().split("T")[0],
          distance: "42.195",
        });
      }
    } catch (error) {
      console.error("Failed to create event:", error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const duration =
      (parseInt(formData.hours) || 0) * 3600 +
      (parseInt(formData.minutes) || 0) * 60 +
      (parseInt(formData.seconds) || 0);

    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          distance: formData.distance,
          duration,
          notes: formData.notes || null,
          weather: formData.weather || null,
          feeling: formData.feeling || null,
          eventId: formData.eventId || null,
        }),
      });

      if (response.ok) {
        router.push("/records");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center gap-3 pt-2">
        <Link href="/records">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">새 기록 추가</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Marathon Event Selection */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">대회 선택</span>
              <button
                type="button"
                onClick={() => setShowAddEvent(true)}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                대회 추가
              </button>
            </div>

            {/* Add New Event Modal */}
            {showAddEvent && (
              <div className="mb-4 p-4 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-primary">새 대회 등록</span>
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    className="text-text-tertiary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-tertiary">대회명</label>
                    <input
                      type="text"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      placeholder="예: 2025 서울마라톤"
                      className="mt-1 w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <label className="text-xs text-text-tertiary">대회 날짜</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="mt-1 w-full min-w-0 max-w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary">거리</label>
                    <div className="flex gap-2 mt-1">
                      {distancePresets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, distance: preset.value })}
                          className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                            newEvent.distance === preset.value
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-surface border-border text-text-secondary hover:border-text-secondary"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateEvent}
                    disabled={!newEvent.name.trim() || isCreatingEvent}
                    className="w-full"
                    size="sm"
                  >
                    {isCreatingEvent ? "등록 중..." : "대회 등록"}
                  </Button>
                </div>
              </div>
            )}

            {/* Searchable Event Dropdown */}
            <div className="relative" ref={eventDropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  value={showEventDropdown ? eventSearchQuery : (formData.eventName || "")}
                  onChange={(e) => {
                    setEventSearchQuery(e.target.value);
                    if (!showEventDropdown) setShowEventDropdown(true);
                  }}
                  onFocus={() => setShowEventDropdown(true)}
                  placeholder="대회명 검색 또는 선택..."
                  className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-10 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {formData.eventId && !showEventDropdown ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, eventId: "", eventName: "" });
                      setEventSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary transition-transform cursor-pointer ${showEventDropdown ? "rotate-180" : ""}`}
                    onClick={() => setShowEventDropdown(!showEventDropdown)}
                  />
                )}
              </div>

              {showEventDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 max-h-[400px] overflow-hidden flex flex-col">
                  {/* 연도 탭 */}
                  <div className="flex gap-1.5 p-3 pb-2 overflow-x-auto scrollbar-hide border-b border-border flex-shrink-0">
                    {availableYears.length > 0 ? (
                      availableYears.map(year => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setSelectedYear(year)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            selectedYear === year
                              ? "bg-primary text-white"
                              : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
                          }`}
                        >
                          {year}년
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-text-tertiary">등록된 대회가 없습니다</span>
                    )}
                  </div>

                  {/* 월 탭 */}
                  <div className="flex gap-1.5 p-3 pt-2 overflow-x-auto scrollbar-hide border-b border-border flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedMonth === null
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      전체
                    </button>
                    {availableMonths.map(month => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => setSelectedMonth(month)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          selectedMonth === month
                            ? "bg-primary text-white"
                            : "bg-surface-elevated text-text-secondary hover:bg-surface-hover"
                        }`}
                      >
                        {month}월
                      </button>
                    ))}
                  </div>

                  {/* 대회 목록 */}
                  <div className="overflow-y-auto flex-1">
                    {filteredEvents.length === 0 ? (
                      <div className="px-4 py-6 text-text-tertiary text-sm text-center">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        {eventSearchQuery
                          ? "검색 결과가 없습니다"
                          : selectedMonth
                            ? `${selectedYear}년 ${selectedMonth}월에 대회가 없습니다`
                            : "등록된 대회가 없습니다"
                        }
                      </div>
                    ) : (
                      filteredEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => handleEventSelect(event)}
                          className={`w-full px-4 py-3 text-left hover:bg-surface-elevated flex items-center justify-between border-b border-border/50 last:border-b-0 ${
                            formData.eventId === event.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                          <p className={`font-medium ${formData.eventId === event.id ? "text-primary" : "text-text-primary"}`}>
                            {event.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {event.date && (
                              <p className="text-xs text-text-tertiary">
                                {new Date(event.date).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-xs text-text-tertiary flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-1 rounded ml-2 flex-shrink-0">
                          {event.distance}km
                        </span>
                      </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Date - Only show when no event is selected */}
        {!formData.eventId && (
          <Card className="overflow-hidden">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">날짜</span>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="mt-2 w-full min-w-0 max-w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </label>
          </Card>
        )}

        {/* Distance */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">거리</span>
            <div className="flex gap-2 mt-2 mb-3">
              {[
                { label: "5K", value: "5" },
                { label: "10K", value: "10" },
                { label: "Half", value: "21.0975" },
                { label: "Full", value: "42.195" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, distance: preset.value })
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.distance === preset.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.distance}
                onChange={(e) =>
                  setFormData({ ...formData, distance: e.target.value })
                }
                placeholder="0.000"
                className="flex-1 bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <span className="text-lg text-text-secondary font-medium">km</span>
            </div>
          </label>
        </Card>

        {/* Show selected event info */}
        {formData.eventId && (
          <Card className="bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">대회 날짜</span>
              <span className="text-base font-medium text-text-primary">
                {new Date(formData.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </Card>
        )}

        {/* Duration */}
        <Card>
          <span className="text-sm font-medium text-text-secondary">시간</span>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min="0"
              max="23"
              value={formData.hours}
              onChange={(e) =>
                setFormData({ ...formData, hours: e.target.value })
              }
              placeholder="0"
              className="w-16 bg-surface-elevated border border-border rounded-lg px-3 py-3 text-center text-text-primary text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-text-tertiary">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={formData.minutes}
              onChange={(e) =>
                setFormData({ ...formData, minutes: e.target.value })
              }
              placeholder="00"
              className="w-16 bg-surface-elevated border border-border rounded-lg px-3 py-3 text-center text-text-primary text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <span className="text-text-tertiary">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={formData.seconds}
              onChange={(e) =>
                setFormData({ ...formData, seconds: e.target.value })
              }
              placeholder="00"
              className="w-16 bg-surface-elevated border border-border rounded-lg px-3 py-3 text-center text-text-primary text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </Card>

        {/* Weather */}
        <Card>
          <span className="text-sm font-medium text-text-secondary">날씨</span>
          <div className="flex gap-2 mt-2">
            {weatherOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.weather === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      weather: isSelected ? "" : option.value,
                    })
                  }
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface-elevated border-border text-text-tertiary hover:border-text-secondary"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Feeling */}
        <Card>
          <span className="text-sm font-medium text-text-secondary">컨디션</span>
          <div className="flex gap-2 mt-2">
            {feelingOptions.map((option) => {
              const isSelected = formData.feeling === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      feeling: isSelected ? 0 : option.value,
                    })
                  }
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-surface-elevated border-border hover:border-text-secondary"
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-xs text-text-tertiary">{option.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">메모</span>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="오늘의 러닝은 어땠나요?"
              rows={3}
              className="mt-2 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </label>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading || !formData.distance || !formData.minutes}
          className="w-full"
        >
          {isLoading ? "저장 중..." : "기록 저장"}
        </Button>
      </form>
    </div>
  );
}
