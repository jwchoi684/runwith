// 거리 상수 (km)
export const DISTANCES = {
  "5K": 5,
  "10K": 10,
  Half: 21.0975,
  Full: 42.195,
} as const;

export type DistanceKey = keyof typeof DISTANCES;

// 거리 레이블
export const DISTANCE_LABELS: Record<DistanceKey, string> = {
  "5K": "5K",
  "10K": "10K",
  Half: "하프",
  Full: "풀마라톤",
};

// Riegel 공식으로 기록 예측
// T2 = T1 × (D2/D1)^1.06
export function predictTime(
  knownTime: number, // 초
  knownDistance: number, // km
  targetDistance: number // km
): number {
  if (knownTime <= 0 || knownDistance <= 0 || targetDistance <= 0) {
    return 0;
  }
  return knownTime * Math.pow(targetDistance / knownDistance, 1.06);
}

// 시간 → 페이스 계산 (초/km)
export function calculatePace(
  timeSeconds: number,
  distanceKm: number
): number {
  if (timeSeconds <= 0 || distanceKm <= 0) {
    return 0;
  }
  return timeSeconds / distanceKm;
}

// 초 → "H:MM:SS" 또는 "MM:SS" 포맷
export function formatTime(seconds: number): string {
  if (seconds <= 0) return "0:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 초/km → "M'SS\"" 포맷
export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0) return "-";

  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

// 시간, 분, 초를 초로 변환
export function timeToSeconds(
  hours: number,
  minutes: number,
  seconds: number
): number {
  return hours * 3600 + minutes * 60 + seconds;
}

// 초를 시간, 분, 초로 분해
export function secondsToTimeComponents(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  return { hours, minutes, seconds };
}

// 모든 거리에 대한 예측 결과 생성
export function predictAllDistances(
  knownTime: number, // 초
  knownDistance: number // km
): Record<DistanceKey, { time: number; pace: number }> {
  const results = {} as Record<DistanceKey, { time: number; pace: number }>;

  for (const [key, distance] of Object.entries(DISTANCES)) {
    const predictedTime = predictTime(knownTime, knownDistance, distance);
    const pace = calculatePace(predictedTime, distance);
    results[key as DistanceKey] = {
      time: predictedTime,
      pace: pace,
    };
  }

  return results;
}

// PaceGroup 타입 정의
export interface PaceGroup {
  id: string;
  groupNumber: number;
  name: string;
  timeFull: number;
  timeHalf: number;
  time10k: number;
  time5k: number;
  paceFull: number;
  paceHalf: number;
  pace10k: number;
  pace5k: number;
  pace1km: number;
  paceRecovery: number;
}

// 예측 풀마라톤 시간으로 가장 가까운 페이스 그룹 찾기
export function findClosestPaceGroup(
  predictedFullTime: number,
  paceGroups: PaceGroup[]
): PaceGroup | null {
  if (!paceGroups || paceGroups.length === 0) {
    return null;
  }

  return paceGroups.reduce((closest, group) => {
    const diff = Math.abs(group.timeFull - predictedFullTime);
    const closestDiff = Math.abs(closest.timeFull - predictedFullTime);
    return diff < closestDiff ? group : closest;
  }, paceGroups[0]);
}

// 한 단계 높은(더 빠른) 그룹 찾기
export function findNextFasterGroup(
  currentGroup: PaceGroup,
  paceGroups: PaceGroup[]
): PaceGroup | null {
  if (!currentGroup || !paceGroups || paceGroups.length === 0) {
    return null;
  }

  const sortedGroups = [...paceGroups].sort(
    (a, b) => a.groupNumber - b.groupNumber
  );
  const currentIndex = sortedGroups.findIndex(
    (g) => g.id === currentGroup.id
  );

  if (currentIndex <= 0) {
    return null; // 이미 가장 빠른 그룹
  }

  return sortedGroups[currentIndex - 1];
}
