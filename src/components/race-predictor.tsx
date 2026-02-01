"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calculator, Target, TrendingUp } from "lucide-react";
import {
  DISTANCES,
  DISTANCE_LABELS,
  DistanceKey,
  predictAllDistances,
  timeToSeconds,
  secondsToTimeComponents,
  formatTime,
  formatPace,
  findClosestPaceGroup,
  findNextFasterGroup,
  PaceGroup,
} from "@/lib/pace-utils";

interface RacePredictorProps {
  paceGroups: PaceGroup[];
}

export function RacePredictor({ paceGroups }: RacePredictorProps) {
  const [selectedDistance, setSelectedDistance] = useState<DistanceKey>("10K");
  const [hoursStr, setHoursStr] = useState("0");
  const [minutesStr, setMinutesStr] = useState("50");
  const [secondsStr, setSecondsStr] = useState("0");
  const [showResults, setShowResults] = useState(false);

  // Convert string values to numbers for calculations
  const hours = parseInt(hoursStr) || 0;
  const minutes = parseInt(minutesStr) || 0;
  const seconds = parseInt(secondsStr) || 0;

  // Calculate predictions
  const predictions = useMemo(() => {
    const totalSeconds = timeToSeconds(hours, minutes, seconds);
    if (totalSeconds <= 0) return null;

    const knownDistance = DISTANCES[selectedDistance];
    return predictAllDistances(totalSeconds, knownDistance);
  }, [selectedDistance, hours, minutes, seconds]);

  // Find matching pace group
  const matchedGroup = useMemo(() => {
    if (!predictions || paceGroups.length === 0) return null;
    return findClosestPaceGroup(predictions.Full.time, paceGroups);
  }, [predictions, paceGroups]);

  // Find next faster group
  const nextGroup = useMemo(() => {
    if (!matchedGroup || paceGroups.length === 0) return null;
    return findNextFasterGroup(matchedGroup, paceGroups);
  }, [matchedGroup, paceGroups]);

  // Calculate improvement needed
  const improvementNeeded = useMemo(() => {
    if (!predictions || !nextGroup) return null;
    const currentHalf = predictions.Half.time;
    const targetHalf = nextGroup.timeHalf;
    return currentHalf - targetHalf;
  }, [predictions, nextGroup]);

  const handleCalculate = () => {
    const totalSeconds = timeToSeconds(hours, minutes, seconds);
    if (totalSeconds > 0) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setShowResults(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">내 기록으로 예측하기</h3>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        {/* Distance Selection */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            기준 거리
          </label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(DISTANCES) as DistanceKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedDistance(key);
                  setShowResults(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDistance === key
                    ? "bg-primary text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary"
                }`}
              >
                {DISTANCE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            완주 기록
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="23"
                value={hoursStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                    setHoursStr(val);
                    setShowResults(false);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") setHoursStr("0");
                }}
                className="w-16 px-3 py-2 rounded-lg bg-surface-elevated border border-border text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-text-secondary text-sm">시간</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="59"
                value={minutesStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                    setMinutesStr(val);
                    setShowResults(false);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") setMinutesStr("0");
                }}
                className="w-16 px-3 py-2 rounded-lg bg-surface-elevated border border-border text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-text-secondary text-sm">분</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="59"
                value={secondsStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                    setSecondsStr(val);
                    setShowResults(false);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") setSecondsStr("0");
                }}
                className="w-16 px-3 py-2 rounded-lg bg-surface-elevated border border-border text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-text-secondary text-sm">초</span>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={timeToSeconds(hours, minutes, seconds) <= 0}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          예측 결과 보기
        </button>
      </div>

      {/* Results Section */}
      {showResults && predictions && (
        <div className="mt-6 space-y-4">
          {/* Predicted Times Table */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="bg-surface-elevated px-4 py-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium text-text-primary text-sm">예상 완주 시간</span>
            </div>
            <div className="divide-y divide-border">
              {(Object.keys(DISTANCES) as DistanceKey[]).map((key) => {
                const isInput = key === selectedDistance;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-4 py-3 ${
                      isInput ? "bg-primary/10" : "bg-surface"
                    }`}
                  >
                    <span className={`font-medium ${isInput ? "text-primary" : "text-text-primary"}`}>
                      {DISTANCE_LABELS[key]}
                      {isInput && " (입력)"}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-sm ${isInput ? "text-primary" : "text-text-secondary"}`}>
                        {formatTime(predictions[key].time)}
                      </span>
                      <span className={`font-mono text-xs ${isInput ? "text-primary/70" : "text-text-tertiary"}`}>
                        {formatPace(predictions[key].pace)}/km
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pace Group Matching */}
          {matchedGroup && (
            <div className="rounded-xl overflow-hidden border border-border bg-surface">
              <div className="bg-surface-elevated px-4 py-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="font-medium text-text-primary text-sm">페이스 그룹 분석</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">현재 수준</span>
                  <span className="font-bold text-primary text-lg">{matchedGroup.name}</span>
                </div>

                {nextGroup && improvementNeeded && improvementNeeded > 0 && (
                  <>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary">다음 목표</span>
                        <span className="font-medium text-success">{nextGroup.name}</span>
                      </div>
                      <div className="text-sm text-text-tertiary">
                        하프마라톤에서{" "}
                        <span className="text-warning font-medium">
                          {formatTime(improvementNeeded)}
                        </span>{" "}
                        단축 필요
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">
                        목표: {formatTime(nextGroup.timeHalf)} (현재 예상: {formatTime(predictions.Half.time)})
                      </div>
                    </div>
                  </>
                )}

                {!nextGroup && (
                  <div className="border-t border-border pt-3">
                    <div className="text-sm text-success">
                      축하합니다! 가장 빠른 그룹입니다!
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full py-2 text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            다시 계산하기
          </button>
        </div>
      )}
    </Card>
  );
}
