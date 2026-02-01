"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cloud, Sun, CloudRain, Snowflake } from "lucide-react";
import Link from "next/link";

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

export default function NewRecordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    distance: "",
    hours: "",
    minutes: "",
    seconds: "",
    notes: "",
    weather: "",
    feeling: 0,
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

        {/* Distance */}
        <Card>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">거리</span>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.distance}
                onChange={(e) =>
                  setFormData({ ...formData, distance: e.target.value })
                }
                placeholder="0.00"
                className="flex-1 bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <span className="text-lg text-text-secondary font-medium">km</span>
            </div>
          </label>
        </Card>

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
