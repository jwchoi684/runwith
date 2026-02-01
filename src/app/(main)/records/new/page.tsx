"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cloud, Sun, CloudRain, Snowflake, ChevronDown, Trophy, MapPin } from "lucide-react";
import Link from "next/link";

interface MarathonEvent {
  id: string;
  name: string;
  location: string | null;
  distance: number;
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

const distanceFilters = [
  { label: "전체", value: "all" },
  { label: "풀마라톤", value: "42.195" },
  { label: "하프", value: "21.0975" },
  { label: "10K", value: "10" },
  { label: "5K", value: "5" },
];

export default function NewRecordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRaceRecord, setIsRaceRecord] = useState(false);
  const [events, setEvents] = useState<MarathonEvent[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState("all");
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

  const handleEventSelect = (event: MarathonEvent) => {
    setFormData({
      ...formData,
      eventId: event.id,
      eventName: event.name,
      distance: event.distance.toString(),
    });
    setShowEventDropdown(false);
  };

  const filteredEvents = events.filter(event => {
    if (selectedDistanceFilter === "all") return true;
    return event.distance === parseFloat(selectedDistanceFilter);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Calculate duration in seconds
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
          eventId: isRaceRecord ? formData.eventId || null : null,
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
        {/* Record Type Toggle */}
        <Card>
          <span className="text-sm font-medium text-text-secondary">기록 유형</span>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsRaceRecord(false);
                setFormData({ ...formData, eventId: "", eventName: "" });
              }}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                !isRaceRecord
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
              }`}
            >
              일반 러닝
            </button>
            <button
              type="button"
              onClick={() => setIsRaceRecord(true)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                isRaceRecord
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
              }`}
            >
              <Trophy className="w-4 h-4" />
              대회 기록
            </button>
          </div>
        </Card>

        {/* Marathon Event Selection */}
        {isRaceRecord && (
          <Card>
            <span className="text-sm font-medium text-text-secondary">대회 선택</span>

            {/* Distance Filter */}
            <div className="flex gap-2 mt-2 mb-3 overflow-x-auto pb-1">
              {distanceFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedDistanceFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedDistanceFilter === filter.value
                      ? "bg-primary text-white"
                      : "bg-surface-elevated text-text-secondary hover:bg-border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Event Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEventDropdown(!showEventDropdown)}
                className="w-full flex items-center justify-between bg-surface-elevated border border-border rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-text-tertiary" />
                  <span className={formData.eventName ? "text-text-primary font-medium" : "text-text-tertiary"}>
                    {formData.eventName || "대회를 선택하세요"}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${showEventDropdown ? "rotate-180" : ""}`} />
              </button>

              {showEventDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                  {filteredEvents.length === 0 ? (
                    <div className="px-4 py-3 text-text-tertiary text-sm">
                      해당 거리의 대회가 없습니다
                    </div>
                  ) : (
                    filteredEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleEventSelect(event)}
                        className={`w-full px-4 py-3 text-left hover:bg-surface-elevated flex items-center justify-between ${
                          formData.eventId === event.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${formData.eventId === event.id ? "text-primary" : "text-text-primary"}`}>
                            {event.name}
                          </p>
                          {event.location && (
                            <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-1 rounded">
                          {event.distance}km
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Date */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">날짜</span>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="mt-2 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </label>
        </Card>

        {/* Distance - Hidden if event is selected */}
        {!isRaceRecord && (
          <Card>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">거리</span>
              <div className="flex gap-2 mt-2 mb-3">
                {[
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
        )}

        {/* Show selected distance for race record */}
        {isRaceRecord && formData.eventId && (
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">거리</span>
              <span className="text-xl font-bold text-primary">{formData.distance} km</span>
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
