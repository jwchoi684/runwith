"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  FileText,
  Users2,
  Trophy,
  ArrowLeft,
  Shield,
  ShieldOff,
  Search,
  Globe,
  Lock,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  MapPin,
  Crown,
  Mail,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Activity,
  Medal,
  Download,
  Check,
  Gauge,
  RefreshCw,
  History,
  Upload,
  FileSpreadsheet,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: Date;
  lastAccessedAt: Date | null;
  accounts: { provider: string }[];
  _count: {
    runningLogs: number;
    crews: number;
    ownedCrews: number;
  };
}

interface RunningLog {
  id: string;
  date: Date;
  distance: number;
  duration: number;
  pace: number | null;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  event: {
    name: string;
  } | null;
}

interface CrewMember {
  id: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  members: CrewMember[];
  _count: {
    members: number;
  };
}

interface MarathonEvent {
  id: string;
  name: string;
  location: string | null;
  region: string;
  distance: number;
  courses: string | null;
  date: Date | null;
  isOfficial: boolean;
  createdAt: Date;
  _count: {
    runningLogs: number;
  };
}

interface ScrapedEvent {
  name: string;
  date: string;
  location: string;
  courses: string[];
  externalId: string;
  alreadyExists?: boolean;
}

interface Ranking {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  totalDistance: number;
  totalDuration: number;
  totalRuns: number;
}

interface CrewMemberMapping {
  userId: string;
  crewId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

interface AccessLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  metadata: JsonValue;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface PageStats {
  path: string;
  count: number;
}

interface Stats {
  totalUsers: number;
  totalRecords: number;
  totalCrews: number;
  totalEvents: number;
}

interface DauTrend {
  date: string;
  count: number;
}

interface MauTrend {
  month: string;
  label: string;
  count: number;
}

interface PaceGroup {
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

interface AdminDashboardProps {
  users: User[];
  stats: Stats;
  recentRecords: RunningLog[];
  crews: Crew[];
  events: MarathonEvent[];
  rankings: Ranking[];
  crewMembers: CrewMemberMapping[];
  paceGroups: PaceGroup[];
  accessLogs: AccessLog[];
  pageStats: PageStats[];
  dauTrend: DauTrend[];
  mauTrend: MauTrend[];
  currentUserId: string;
}

type View = "dashboard" | "users" | "records" | "crews" | "events" | "rankings" | "pace-groups" | "access-logs" | "user-detail" | "crew-detail";

const coursePresets = ["Full", "Half", "10K", "5K"];

const providerLabels: Record<string, { label: string; color: string }> = {
  google: { label: "Google", color: "bg-blue-100 text-blue-700" },
  kakao: { label: "Kakao", color: "bg-yellow-100 text-yellow-700" },
};

export function AdminDashboard({
  users,
  stats,
  recentRecords,
  crews,
  events,
  rankings,
  crewMembers,
  paceGroups,
  accessLogs,
  pageStats,
  dauTrend,
  mauTrend,
  currentUserId,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [selectedRankingCrew, setSelectedRankingCrew] = useState<string>("all");

  // Event management state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarathonEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    name: "",
    location: "",
    region: "domestic" as "domestic" | "international",
    courses: [] as string[],
    customCourse: "",
    date: "",
    isOfficial: true,
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Event filter state
  const [eventFilterYear, setEventFilterYear] = useState<number | null>(null);
  const [eventFilterMonth, setEventFilterMonth] = useState<number | null>(null);

  // Import events state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [scrapedEvents, setScrapedEvents] = useState<ScrapedEvent[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Pace group management state
  const [showPaceGroupModal, setShowPaceGroupModal] = useState(false);
  const [editingPaceGroup, setEditingPaceGroup] = useState<PaceGroup | null>(null);
  const [paceGroupForm, setPaceGroupForm] = useState({
    groupNumber: 1,
    name: "",
    timeFull: "",
    timeHalf: "",
    time10k: "",
    time5k: "",
    paceFull: "",
    paceHalf: "",
    pace10k: "",
    pace5k: "",
    pace1km: "",
    paceRecovery: "",
  });
  const [isSavingPaceGroup, setIsSavingPaceGroup] = useState(false);
  const [deletingPaceGroupId, setDeletingPaceGroupId] = useState<string | null>(null);
  const [isSeedingPaceGroups, setIsSeedingPaceGroups] = useState(false);

  // Excel upload state
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelUploadResult, setExcelUploadResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedCrew = crews.find((c) => c.id === selectedCrewId);
  const userRecords = recentRecords.filter((r) => r.user.id === selectedUserId);

  // 선택된 사용자의 접속 로그 필터링
  const userAccessLogs = accessLogs.filter((log) => log.userId === selectedUserId);

  // 사용자 페이지 뷰 통계
  const userPageViews = userAccessLogs.reduce((acc, log) => {
    const path = log.path || "unknown";
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sortedUserPageViews = Object.entries(userPageViews).sort((a, b) => b[1] - a[1]);

  // Filter rankings by crew
  const filteredRankings = selectedRankingCrew === "all"
    ? rankings
    : rankings.filter((r) =>
        crewMembers.some((cm) => cm.userId === r.userId && cm.crewId === selectedRankingCrew)
      );

  const handlePromoteUser = async (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole === "user") {
      if (!confirm("자신의 관리자 권한을 해제하시겠습니까? 이 작업 후에는 관리자 페이지에 접근할 수 없습니다.")) {
        return;
      }
    }

    setPromotingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "권한 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("권한 변경에 실패했습니다.");
    } finally {
      setPromotingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    if (userId === currentUserId) {
      alert("자신의 계정은 삭제할 수 없습니다.");
      return;
    }

    const confirmMsg = `정말 "${userName || "Unknown"}" 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며 다음 데이터가 삭제됩니다:\n- 모든 러닝 기록\n- 크루 멤버십\n- 로그인 정보\n\n소유한 크루는 다른 멤버에게 이전되거나 삭제됩니다.`;

    if (!confirm(confirmMsg)) return;

    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`사용자가 삭제되었습니다.\n- 삭제된 기록: ${data.deletedRecords}개\n- 탈퇴한 크루: ${data.deletedMemberships}개`);
        navigateTo("users");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const openEventModal = (event?: MarathonEvent) => {
    if (event) {
      setEditingEvent(event);
      const allCourses = event.courses ? event.courses.split(",") : [];
      const presetCourses = allCourses.filter(c => coursePresets.includes(c));
      const customCourses = allCourses.filter(c => !coursePresets.includes(c));
      setEventForm({
        name: event.name,
        location: event.location || "",
        region: (event.region as "domestic" | "international") || "domestic",
        courses: presetCourses,
        customCourse: customCourses.join(", "),
        date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
        isOfficial: event.isOfficial,
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        name: "",
        location: "",
        region: "domestic",
        courses: [],
        customCourse: "",
        date: "",
        isOfficial: true,
      });
    }
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.name.trim()) return;

    setIsSavingEvent(true);
    try {
      const url = editingEvent
        ? `/api/admin/events/${editingEvent.id}`
        : "/api/admin/events";
      const method = editingEvent ? "PUT" : "POST";

      // Combine preset courses and custom courses
      const allCourses = [...eventForm.courses];
      if (eventForm.customCourse.trim()) {
        const customCourses = eventForm.customCourse.split(",").map(c => c.trim()).filter(c => c);
        allCourses.push(...customCourses);
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventForm.name.trim(),
          location: eventForm.location.trim() || null,
          region: eventForm.region,
          distance: 0, // Deprecated field, keeping for schema compatibility
          courses: allCourses.length > 0 ? allCourses.join(",") : null,
          date: eventForm.date || null,
          isOfficial: eventForm.isOfficial,
        }),
      });

      if (response.ok) {
        setShowEventModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("정말 이 대회를 삭제하시겠습니까? 이 대회와 연결된 기록은 유지됩니다.")) return;

    setDeletingEventId(eventId);
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingEventId(null);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEventIds);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEventIds(newSelection);
  };

  const toggleAllEvents = () => {
    if (selectedEventIds.size === filteredEvents.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const handleBulkDeleteEvents = async () => {
    if (selectedEventIds.size === 0) return;

    if (!confirm(`선택한 ${selectedEventIds.size}개의 대회를 삭제하시겠습니까? 연결된 기록은 유지됩니다.`)) return;

    setIsDeletingBulk(true);
    try {
      const response = await fetch("/api/admin/events/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: Array.from(selectedEventIds) }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedEventIds(new Set());
        router.refresh();
        alert(`${data.deletedCount}개의 대회가 삭제되었습니다.`);
      } else {
        const data = await response.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to bulk delete events:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleFetchImportEvents = async () => {
    setIsLoadingImport(true);
    try {
      const response = await fetch(`/api/admin/events/import?year=${importYear}`);
      if (response.ok) {
        const data = await response.json();
        setScrapedEvents(data.events);
        // Pre-select new events
        const newIds = data.events
          .filter((e: ScrapedEvent) => !e.alreadyExists)
          .map((e: ScrapedEvent) => e.externalId);
        setSelectedImportIds(new Set(newIds));
      } else {
        alert("대회 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch import events:", error);
      alert("대회 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingImport(false);
    }
  };

  const handleImportEvents = async () => {
    if (selectedImportIds.size === 0) return;

    setIsImporting(true);
    try {
      const eventsToImport = scrapedEvents.filter((e) => selectedImportIds.has(e.externalId));
      const response = await fetch("/api/admin/events/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToImport }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowImportModal(false);
        setScrapedEvents([]);
        setSelectedImportIds(new Set());
        router.refresh();
        alert(`${data.importedCount}개의 대회를 가져왔습니다.`);
      } else {
        alert("대회 가져오기에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to import events:", error);
      alert("대회 가져오기에 실패했습니다.");
    } finally {
      setIsImporting(false);
    }
  };

  const toggleCourse = (course: string) => {
    setEventForm((prev) => ({
      ...prev,
      courses: prev.courses.includes(course)
        ? prev.courses.filter((c) => c !== course)
        : [...prev.courses, course],
    }));
  };

  // Pace group handlers
  const secondsToTimeStr = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const timeStrToSeconds = (time: string): number => {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const openPaceGroupModal = (paceGroup?: PaceGroup) => {
    if (paceGroup) {
      setEditingPaceGroup(paceGroup);
      setPaceGroupForm({
        groupNumber: paceGroup.groupNumber,
        name: paceGroup.name,
        timeFull: secondsToTimeStr(paceGroup.timeFull),
        timeHalf: secondsToTimeStr(paceGroup.timeHalf),
        time10k: secondsToTimeStr(paceGroup.time10k),
        time5k: secondsToTimeStr(paceGroup.time5k),
        paceFull: secondsToTimeStr(paceGroup.paceFull),
        paceHalf: secondsToTimeStr(paceGroup.paceHalf),
        pace10k: secondsToTimeStr(paceGroup.pace10k),
        pace5k: secondsToTimeStr(paceGroup.pace5k),
        pace1km: secondsToTimeStr(paceGroup.pace1km),
        paceRecovery: secondsToTimeStr(paceGroup.paceRecovery),
      });
    } else {
      setEditingPaceGroup(null);
      const nextGroupNumber = paceGroups.length > 0
        ? Math.max(...paceGroups.map(g => g.groupNumber)) + 1
        : 1;
      setPaceGroupForm({
        groupNumber: nextGroupNumber,
        name: `${nextGroupNumber}그룹`,
        timeFull: "3:30:00",
        timeHalf: "1:40:00",
        time10k: "45:00",
        time5k: "22:00",
        paceFull: "5:00",
        paceHalf: "4:45",
        pace10k: "4:30",
        pace5k: "4:25",
        pace1km: "4:00",
        paceRecovery: "5:30",
      });
    }
    setShowPaceGroupModal(true);
  };

  const handleSavePaceGroup = async () => {
    if (!paceGroupForm.name.trim()) return;

    setIsSavingPaceGroup(true);
    try {
      const url = editingPaceGroup
        ? `/api/admin/pace-groups/${editingPaceGroup.id}`
        : "/api/admin/pace-groups";
      const method = editingPaceGroup ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupNumber: paceGroupForm.groupNumber,
          name: paceGroupForm.name.trim(),
          timeFull: timeStrToSeconds(paceGroupForm.timeFull),
          timeHalf: timeStrToSeconds(paceGroupForm.timeHalf),
          time10k: timeStrToSeconds(paceGroupForm.time10k),
          time5k: timeStrToSeconds(paceGroupForm.time5k),
          paceFull: timeStrToSeconds(paceGroupForm.paceFull),
          paceHalf: timeStrToSeconds(paceGroupForm.paceHalf),
          pace10k: timeStrToSeconds(paceGroupForm.pace10k),
          pace5k: timeStrToSeconds(paceGroupForm.pace5k),
          pace1km: timeStrToSeconds(paceGroupForm.pace1km),
          paceRecovery: timeStrToSeconds(paceGroupForm.paceRecovery),
        }),
      });

      if (response.ok) {
        setShowPaceGroupModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save pace group:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSavingPaceGroup(false);
    }
  };

  const handleDeletePaceGroup = async (id: string) => {
    if (!confirm("정말 이 페이스 그룹을 삭제하시겠습니까?")) return;

    setDeletingPaceGroupId(id);
    try {
      const response = await fetch(`/api/admin/pace-groups/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete pace group:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingPaceGroupId(null);
    }
  };

  const handleSeedPaceGroups = async () => {
    if (paceGroups.length > 0) {
      if (!confirm("기존 페이스 그룹 데이터를 모두 삭제하고 초기 데이터로 채웁니다. 계속하시겠습니까?")) {
        return;
      }
    }

    setIsSeedingPaceGroups(true);
    try {
      const response = await fetch("/api/pace-groups/seed", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.count}개의 페이스 그룹이 생성되었습니다.`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "초기화에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to seed pace groups:", error);
      alert("초기화에 실패했습니다.");
    } finally {
      setIsSeedingPaceGroups(false);
    }
  };

  // Excel upload handlers
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingExcel(true);
    setExcelUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/events/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setExcelUploadResult(result);
        if (result.success > 0) {
          router.refresh();
        }
      } else {
        alert(result.error || "업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("Excel upload error:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingExcel(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/events/template");
      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "marathon_events_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Template download error:", error);
      alert("템플릿 다운로드에 실패했습니다.");
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return formatDate(date);
  };

  const formatPace = (pace: number | null) => {
    if (!pace) return "-";
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getProviderBadge = (accounts: { provider: string }[]) => {
    if (!accounts || accounts.length === 0) return null;
    const provider = accounts[0].provider;
    const info = providerLabels[provider] || { label: provider, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true; // 검색어 없으면 모든 사용자 표시
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const filteredCrews = crews.filter(
    (crew) =>
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.owner.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter((event) => {
    // 검색어 필터
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());

    // 연도 필터
    const matchesYear =
      eventFilterYear === null ||
      (event.date && new Date(event.date).getFullYear() === eventFilterYear);

    // 월 필터
    const matchesMonth =
      eventFilterMonth === null ||
      (event.date && new Date(event.date).getMonth() + 1 === eventFilterMonth);

    return matchesSearch && matchesYear && matchesMonth;
  });

  // 대회 연도 목록 (필터용)
  const eventYears = [...new Set(events.map((e) => e.date ? new Date(e.date).getFullYear() : null).filter((y): y is number => y !== null))].sort((a, b) => b - a);

  const openUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setActiveView("user-detail");
    setMobileMenuOpen(false);
  };

  const openCrewDetail = (crewId: string) => {
    setSelectedCrewId(crewId);
    setActiveView("crew-detail");
    setMobileMenuOpen(false);
  };

  const navigateTo = (view: View) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    setSearchQuery("");
  };

  const menuItems = [
    { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
    { id: "users" as View, label: "사용자 관리", icon: Users },
    { id: "records" as View, label: "기록 관리", icon: FileText },
    { id: "crews" as View, label: "크루 관리", icon: Users2 },
    { id: "events" as View, label: "대회 관리", icon: Trophy },
    { id: "pace-groups" as View, label: "페이스 차트", icon: Gauge },
    { id: "rankings" as View, label: "Ranking", icon: BarChart3 },
    { id: "access-logs" as View, label: "접속 로그", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-surface border-r border-border">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-text-primary">Admin</h1>
            <p className="text-xs text-text-tertiary">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeView === item.id ||
                (item.id === "users" && activeView === "user-detail") ||
                (item.id === "crews" && activeView === "crew-detail")
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start">
              <ArrowLeft className="w-4 h-4 mr-2" />
              앱으로 돌아가기
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-0 bg-surface flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-text-primary">Admin Menu</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-base font-medium transition-colors ${
                    activeView === item.id ||
                    (item.id === "users" && activeView === "user-detail") ||
                    (item.id === "crews" && activeView === "crew-detail")
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-surface-elevated"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <Link href="/">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  앱으로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEventModal(false)} />
          <div className="relative bg-surface rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">
                {editingEvent ? "대회 수정" : "새 대회 추가"}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">대회명 *</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="예: 2025 서울마라톤"
                  className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">장소</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="예: 서울"
                  className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">지역</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, region: "domestic" })}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      eventForm.region === "domestic"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
                    }`}
                  >
                    🇰🇷 국내
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, region: "international" })}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      eventForm.region === "international"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
                    }`}
                  >
                    🌍 해외
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">코스 선택</label>
                <div className="flex gap-2 mt-1">
                  {coursePresets.map((course) => (
                    <button
                      key={course}
                      type="button"
                      onClick={() => toggleCourse(course)}
                      className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        eventForm.courses.includes(course)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
                      }`}
                    >
                      {course}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-tertiary mt-1">복수 선택 가능</p>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">커스텀 코스</label>
                <input
                  type="text"
                  value={eventForm.customCourse}
                  onChange={(e) => setEventForm({ ...eventForm, customCourse: e.target.value })}
                  placeholder="예: 32km, 100Mile, 48K/40K/34K"
                  className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-text-tertiary mt-1">쉼표로 구분하여 여러 코스 입력 가능</p>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">대회 날짜</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isOfficial"
                  checked={eventForm.isOfficial}
                  onChange={(e) => setEventForm({ ...eventForm, isOfficial: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isOfficial" className="text-sm text-text-secondary">
                  공식 대회
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveEvent}
                  disabled={!eventForm.name.trim() || isSavingEvent}
                  className="flex-1"
                >
                  {isSavingEvent ? "저장 중..." : editingEvent ? "수정" : "추가"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-surface rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">마라톤 일정 가져오기</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-border">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-text-secondary">연도 선택</label>
                  <select
                    value={importYear}
                    onChange={(e) => setImportYear(parseInt(e.target.value))}
                    className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleFetchImportEvents}
                  disabled={isLoadingImport}
                >
                  {isLoadingImport ? "불러오는 중..." : "일정 조회"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {scrapedEvents.length === 0 ? (
                <p className="text-center text-text-tertiary py-8">
                  연도를 선택하고 &quot;일정 조회&quot; 버튼을 눌러주세요
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-text-primary font-medium">
                        총 {scrapedEvents.length}개 대회
                      </span>
                      <span className="text-success">
                        새 대회: {scrapedEvents.filter(e => !e.alreadyExists).length}개
                      </span>
                      <span className="text-text-tertiary">
                        등록됨: {scrapedEvents.filter(e => e.alreadyExists).length}개
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const newIds = scrapedEvents
                          .filter(e => !e.alreadyExists)
                          .map(e => e.externalId);
                        setSelectedImportIds(new Set(newIds));
                      }}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      새 대회만 선택
                    </button>
                  </div>

                  {/* New Events Section */}
                  {scrapedEvents.filter(e => !e.alreadyExists).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        새로운 대회
                      </h4>
                      <div className="space-y-2">
                        {scrapedEvents.filter(e => !e.alreadyExists).map((event) => (
                          <div
                            key={event.externalId}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                          >
                            <button
                              onClick={() => {
                                setSelectedImportIds(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(event.externalId)) {
                                    newSet.delete(event.externalId);
                                  } else {
                                    newSet.add(event.externalId);
                                  }
                                  return newSet;
                                });
                              }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                selectedImportIds.has(event.externalId)
                                  ? "bg-primary border-primary text-white"
                                  : "border-border hover:border-primary"
                              }`}
                            >
                              {selectedImportIds.has(event.externalId) && (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-text-primary truncate">{event.name}</p>
                              <div className="flex items-center gap-3 text-sm text-text-tertiary">
                                <span>{event.date}</span>
                                {event.location && <span>{event.location}</span>}
                                <span>{event.courses.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Already Exists Section */}
                  {scrapedEvents.filter(e => e.alreadyExists).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-tertiary mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-text-tertiary"></span>
                        이미 등록된 대회
                      </h4>
                      <div className="space-y-2">
                        {scrapedEvents.filter(e => e.alreadyExists).map((event) => (
                          <div
                            key={event.externalId}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-secondary"
                          >
                            <div className="w-5 h-5 rounded border-2 border-border-light bg-surface-secondary flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-text-disabled" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-text-tertiary truncate">
                                {event.name}
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-surface rounded text-text-disabled">
                                  등록됨
                                </span>
                              </p>
                              <div className="flex items-center gap-3 text-sm text-text-disabled">
                                <span>{event.date}</span>
                                {event.location && <span>{event.location}</span>}
                                <span>{event.courses.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setShowImportModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleImportEvents}
                disabled={selectedImportIds.size === 0 || isImporting}
                className="flex-1"
              >
                {isImporting ? "가져오는 중..." : `${selectedImportIds.size}개 대회 가져오기`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pace Group Modal */}
      {showPaceGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPaceGroupModal(false)} />
          <div className="relative bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">
                {editingPaceGroup ? "페이스 그룹 수정" : "새 페이스 그룹 추가"}
              </h2>
              <button
                onClick={() => setShowPaceGroupModal(false)}
                className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">그룹 번호</label>
                  <input
                    type="number"
                    value={paceGroupForm.groupNumber}
                    onChange={(e) => setPaceGroupForm({ ...paceGroupForm, groupNumber: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">그룹명</label>
                  <input
                    type="text"
                    value={paceGroupForm.name}
                    onChange={(e) => setPaceGroupForm({ ...paceGroupForm, name: e.target.value })}
                    placeholder="예: 1그룹"
                    className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium text-text-primary mb-3">목표 시간 (HH:MM:SS 또는 MM:SS)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Full</label>
                    <input
                      type="text"
                      value={paceGroupForm.timeFull}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, timeFull: e.target.value })}
                      placeholder="3:30:00"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Half</label>
                    <input
                      type="text"
                      value={paceGroupForm.timeHalf}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, timeHalf: e.target.value })}
                      placeholder="1:40:00"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">10K</label>
                    <input
                      type="text"
                      value={paceGroupForm.time10k}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, time10k: e.target.value })}
                      placeholder="45:00"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">5K</label>
                    <input
                      type="text"
                      value={paceGroupForm.time5k}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, time5k: e.target.value })}
                      placeholder="22:00"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium text-text-primary mb-3">페이스 (M:SS 형식)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Full</label>
                    <input
                      type="text"
                      value={paceGroupForm.paceFull}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, paceFull: e.target.value })}
                      placeholder="5:00"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Half</label>
                    <input
                      type="text"
                      value={paceGroupForm.paceHalf}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, paceHalf: e.target.value })}
                      placeholder="4:45"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">10K</label>
                    <input
                      type="text"
                      value={paceGroupForm.pace10k}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, pace10k: e.target.value })}
                      placeholder="4:30"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">5K</label>
                    <input
                      type="text"
                      value={paceGroupForm.pace5k}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, pace5k: e.target.value })}
                      placeholder="4:25"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">1km 인터벌</label>
                    <input
                      type="text"
                      value={paceGroupForm.pace1km}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, pace1km: e.target.value })}
                      placeholder="4:00"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary text-primary">Recovery</label>
                    <input
                      type="text"
                      value={paceGroupForm.paceRecovery}
                      onChange={(e) => setPaceGroupForm({ ...paceGroupForm, paceRecovery: e.target.value })}
                      placeholder="5:30"
                      className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowPaceGroupModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSavePaceGroup}
                  disabled={!paceGroupForm.name.trim() || isSavingPaceGroup}
                  className="flex-1"
                >
                  {isSavingPaceGroup ? "저장 중..." : editingPaceGroup ? "수정" : "추가"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-text-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-text-primary">
              {menuItems.find(m => m.id === activeView)?.label || "Admin"}
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              {menuItems.find(m => m.id === activeView)?.label || "Admin"}
            </h1>
          </div>

          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <div className="space-y-4 lg:space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <Card className="text-center py-3 sm:py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("users")}>
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
                  <p className="text-xs sm:text-sm text-text-tertiary">전체 사용자</p>
                </Card>
                <Card className="text-center py-3 sm:py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("records")}>
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-success mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalRecords}</p>
                  <p className="text-xs sm:text-sm text-text-tertiary">전체 기록</p>
                </Card>
                <Card className="text-center py-3 sm:py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("crews")}>
                  <Users2 className="w-6 h-6 sm:w-8 sm:h-8 text-warning mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalCrews}</p>
                  <p className="text-xs sm:text-sm text-text-tertiary">전체 크루</p>
                </Card>
                <Card className="text-center py-3 sm:py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("events")}>
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-error mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalEvents}</p>
                  <p className="text-xs sm:text-sm text-text-tertiary">마라톤 대회</p>
                </Card>
              </div>

              {/* DAU/MAU Trend Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* DAU Trend (Last 30 Days) */}
                <section>
                  <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-2 sm:mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                    DAU 추이 (최근 30일)
                  </h2>
                  <Card className="p-3 sm:p-4">
                    {/* Chart Area */}
                    <div className="flex items-end gap-[2px] h-24 sm:h-32 mb-2">
                      {dauTrend.map((day, index) => {
                        const maxCount = Math.max(...dauTrend.map(d => d.count), 1);
                        const height = (day.count / maxCount) * 100;
                        const isToday = index === dauTrend.length - 1;
                        return (
                          <div
                            key={day.date}
                            className="flex-1 group relative cursor-pointer"
                            title={`${day.date}: ${day.count}명`}
                          >
                            <div
                              className={`w-full rounded-sm transition-all hover:opacity-80 ${isToday ? "bg-success" : "bg-success/50"}`}
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                              <div className="bg-surface-elevated px-2 py-1 rounded text-[10px] text-text-primary whitespace-nowrap shadow-lg border border-border">
                                {day.count}명
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* X-axis Labels */}
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-text-tertiary border-t border-border pt-2">
                      <span>{dauTrend[0]?.date.slice(5)}</span>
                      <span>{dauTrend[9]?.date.slice(5)}</span>
                      <span>{dauTrend[19]?.date.slice(5)}</span>
                      <span>{dauTrend[29]?.date.slice(5)}</span>
                    </div>
                    {/* Summary */}
                    <div className="flex justify-center mt-2">
                      <span className="text-xs sm:text-sm font-medium text-success">오늘: {dauTrend[dauTrend.length - 1]?.count || 0}명</span>
                    </div>
                  </Card>
                </section>

                {/* MAU Trend (Last 12 Months) */}
                <section>
                  <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-2 sm:mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    MAU 추이 (최근 12개월)
                  </h2>
                  <Card className="p-3 sm:p-4">
                    {/* Chart Area */}
                    <div className="flex items-end gap-1 h-24 sm:h-32 mb-2">
                      {mauTrend.map((month, index) => {
                        const maxCount = Math.max(...mauTrend.map(m => m.count), 1);
                        const height = (month.count / maxCount) * 100;
                        const isCurrentMonth = index === mauTrend.length - 1;
                        return (
                          <div
                            key={month.month}
                            className="flex-1 group relative cursor-pointer"
                            title={`${month.month}: ${month.count}명`}
                          >
                            <div
                              className={`w-full rounded-sm transition-all hover:opacity-80 ${isCurrentMonth ? "bg-primary" : "bg-primary/50"}`}
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                              <div className="bg-surface-elevated px-2 py-1 rounded text-[10px] text-text-primary whitespace-nowrap shadow-lg border border-border">
                                {month.count}명
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* X-axis Labels */}
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-text-tertiary border-t border-border pt-2">
                      {mauTrend.map((month) => (
                        <span key={month.month} className="flex-1 text-center">{month.label}</span>
                      ))}
                    </div>
                    {/* Summary */}
                    <div className="flex justify-center mt-2">
                      <span className="text-xs sm:text-sm font-medium text-primary">이번 달: {mauTrend[mauTrend.length - 1]?.count || 0}명</span>
                    </div>
                  </Card>
                </section>
              </div>

              {/* Statistics Section */}
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  인기 페이지 (조회수)
                </h2>
                <Card className="p-4">
                  {pageStats.length === 0 ? (
                    <div className="text-center text-text-tertiary py-4">데이터가 없습니다</div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const maxCount = Math.max(...pageStats.slice(0, 10).map(s => s.count));
                        return pageStats.slice(0, 10).map((stat, index) => {
                          const percentage = (stat.count / maxCount) * 100;
                          const getPageIcon = (path: string) => {
                            if (path === "/" || path === "/home") return "🏠";
                            if (path.includes("/records")) return "📊";
                            if (path.includes("/crews")) return "👥";
                            if (path.includes("/events")) return "🏃";
                            if (path.includes("/profile")) return "👤";
                            if (path.includes("/pace")) return "⏱️";
                            if (path.includes("/ranking")) return "🏆";
                            if (path.includes("/login")) return "🔑";
                            return "📄";
                          };
                          const getPageName = (path: string) => {
                            if (path === "/") return "홈";
                            if (path === "/records") return "기록";
                            if (path === "/crews") return "크루";
                            if (path === "/events") return "대회 일정";
                            if (path === "/profile") return "프로필";
                            if (path === "/pace-chart") return "페이스 차트";
                            if (path === "/ranking") return "랭킹";
                            if (path === "/login") return "로그인";
                            return path;
                          };
                          return (
                            <div key={stat.path} className="group">
                              <div className="flex items-center gap-3 mb-1.5">
                                {/* Rank Badge */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30" :
                                  index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30" :
                                  index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30" :
                                  "bg-surface-elevated text-text-tertiary"
                                }`}>
                                  {index + 1}
                                </div>
                                {/* Page Icon & Name */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-base">{getPageIcon(stat.path)}</span>
                                  <span className="font-medium text-text-primary truncate">{getPageName(stat.path)}</span>
                                  <span className="text-xs text-text-tertiary truncate hidden sm:inline">({stat.path})</span>
                                </div>
                                {/* Count */}
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-primary">{stat.count.toLocaleString()}</span>
                                  <span className="text-xs text-text-tertiary ml-1">회</span>
                                </div>
                              </div>
                              {/* Progress Bar */}
                              <div className="ml-10 h-2 bg-surface-elevated rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                                    index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500" :
                                    index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-500" :
                                    "bg-primary/60"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </Card>
              </section>
            </div>
          )}

          {/* Users View */}
          {activeView === "users" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <Card>
                  <p className="text-center text-text-tertiary py-8">사용자가 없습니다</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.id}
                        className="p-4 cursor-pointer hover:shadow-toss-lg transition-shadow"
                        onClick={() => openUserDetail(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image src={user.image} alt="" width={44} height={44} className="rounded-full" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium text-lg">
                              {user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-primary truncate">{user.name || "Unknown"}</span>
                              {getProviderBadge(user.accounts)}
                              {user.role === "admin" && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">Admin</span>
                              )}
                            </div>
                            <p className="text-sm text-text-tertiary truncate">{user.email}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-text-tertiary">
                          <span>기록 {user._count.runningLogs}</span>
                          <span>크루 {user._count.crews}</span>
                          <span className="ml-auto">{formatDate(user.createdAt)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">사용자</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden lg:table-cell">이메일</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">역할</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">기록</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">크루</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden xl:table-cell">가입일</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden xl:table-cell">마지막 접속</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr
                              key={user.id}
                              onClick={() => openUserDetail(user.id)}
                              className="border-b border-border last:border-b-0 hover:bg-surface-elevated cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {user.image ? (
                                    <Image src={user.image} alt="" width={36} height={36} className="rounded-full" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                                      {user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-text-primary">{user.name || "Unknown"}</span>
                                      {getProviderBadge(user.accounts)}
                                    </div>
                                    <p className="text-xs text-text-tertiary lg:hidden">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">{user.email}</td>
                              <td className="px-4 py-3 text-center">
                                {user.role === "admin" ? (
                                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Admin</span>
                                ) : (
                                  <span className="text-xs text-text-tertiary">User</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-text-secondary">{user._count.runningLogs}</td>
                              <td className="px-4 py-3 text-center text-sm text-text-secondary">{user._count.crews}</td>
                              <td className="px-4 py-3 text-sm text-text-tertiary hidden xl:table-cell">{formatDate(user.createdAt)}</td>
                              <td className="px-4 py-3 text-sm text-text-tertiary hidden xl:table-cell">
                                {user.lastAccessedAt ? formatRelativeTime(new Date(user.lastAccessedAt)) : "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <ChevronRight className="w-4 h-4 text-text-tertiary inline-block" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Records View */}
          {activeView === "records" && (
            <div className="space-y-4">
              {recentRecords.length === 0 ? (
                <Card>
                  <p className="text-center text-text-tertiary py-8">기록이 없습니다</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {recentRecords.map((record) => (
                      <Card
                        key={record.id}
                        className="p-4 cursor-pointer hover:shadow-toss-lg transition-shadow"
                        onClick={() => openUserDetail(record.user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {record.user.image ? (
                              <Image src={record.user.image} alt="" width={40} height={40} className="rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                                {record.user.name?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-text-primary">{record.user.name || record.user.email}</p>
                              <p className="text-xs text-text-tertiary">{record.event?.name || "개인 기록"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary tabular-nums">{formatDuration(record.duration)}</p>
                            <p className="text-xs text-text-tertiary tabular-nums">{formatPace(record.pace)} /km</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-text-tertiary">
                          <span className="font-medium text-text-primary">{record.distance.toFixed(2)} km</span>
                          <span>{formatDate(record.date)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">사용자</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden lg:table-cell">대회/기록</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">거리</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">시간</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary hidden lg:table-cell">페이스</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">날짜</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRecords.map((record) => (
                            <tr
                              key={record.id}
                              onClick={() => openUserDetail(record.user.id)}
                              className="border-b border-border last:border-b-0 hover:bg-surface-elevated cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {record.user.image ? (
                                    <Image src={record.user.image} alt="" width={36} height={36} className="rounded-full" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                                      {record.user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-text-primary">{record.user.name || record.user.email}</span>
                                    <p className="text-xs text-text-tertiary lg:hidden">{record.event?.name || "개인 기록"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">{record.event?.name || "개인 기록"}</td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-text-primary">{record.distance.toFixed(2)} km</td>
                              <td className="px-4 py-3 text-right text-sm font-mono text-primary font-medium">{formatDuration(record.duration)}</td>
                              <td className="px-4 py-3 text-right text-sm text-text-secondary hidden lg:table-cell">{formatPace(record.pace)} /km</td>
                              <td className="px-4 py-3 text-sm text-text-tertiary">{formatDate(record.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Crews View */}
          {activeView === "crews" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="크루명 또는 크루장으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {filteredCrews.length === 0 ? (
                <Card>
                  <p className="text-center text-text-tertiary py-8">크루가 없습니다</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredCrews.map((crew) => (
                      <Card
                        key={crew.id}
                        className="p-4 cursor-pointer hover:shadow-toss-lg transition-shadow"
                        onClick={() => openCrewDetail(crew.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white text-lg font-bold">
                            {crew.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-primary truncate">{crew.name}</span>
                              {crew.isPublic ? (
                                <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">공개</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-medium rounded-full">비공개</span>
                              )}
                            </div>
                            <p className="text-sm text-text-tertiary truncate">{crew.description || "설명 없음"}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-text-tertiary">
                          <div className="flex items-center gap-2">
                            {crew.owner.image ? (
                              <Image src={crew.owner.image} alt="" width={20} height={20} className="rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary text-xs">
                                {crew.owner.name?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                            <span>{crew.owner.name || crew.owner.email}</span>
                          </div>
                          <span>멤버 {crew._count.members}명</span>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">크루</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden lg:table-cell">설명</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">크루장</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">멤버</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">공개</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden xl:table-cell">생성일</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCrews.map((crew) => (
                            <tr
                              key={crew.id}
                              onClick={() => openCrewDetail(crew.id)}
                              className="border-b border-border last:border-b-0 hover:bg-surface-elevated cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                                    {crew.name.charAt(0)}
                                  </div>
                                  <span className="font-medium text-text-primary">{crew.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary max-w-[200px] truncate hidden lg:table-cell">
                                {crew.description || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {crew.owner.image ? (
                                    <Image src={crew.owner.image} alt="" width={24} height={24} className="rounded-full" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary text-xs font-medium">
                                      {crew.owner.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <span className="text-sm text-text-secondary">{crew.owner.name || crew.owner.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-medium text-text-primary">{crew._count.members}</td>
                              <td className="px-4 py-3 text-center">
                                {crew.isPublic ? (
                                  <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full">공개</span>
                                ) : (
                                  <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">비공개</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-text-tertiary hidden xl:table-cell">{formatDate(crew.createdAt)}</td>
                              <td className="px-4 py-3 text-center">
                                <ChevronRight className="w-4 h-4 text-text-tertiary inline-block" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Events View */}
          {activeView === "events" && (
            <div className="space-y-4">
              {/* Search and Filters - Responsive */}
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="대회명 또는 장소로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2">
                  {/* Year Filter */}
                  <select
                    value={eventFilterYear ?? ""}
                    onChange={(e) => setEventFilterYear(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">전체 연도</option>
                    {eventYears.map((year) => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>

                  {/* Month Filter */}
                  <select
                    value={eventFilterMonth ?? ""}
                    onChange={(e) => setEventFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">전체 월</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <option key={month} value={month}>{month}월</option>
                    ))}
                  </select>

                  <span className="flex items-center text-sm text-text-tertiary ml-auto">
                    총 {filteredEvents.length}개
                  </span>
                </div>

                {/* Action Buttons - Responsive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button variant="secondary" onClick={handleDownloadTemplate} className="text-sm">
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">템플릿</span>
                    <span className="sm:hidden">템플릿</span>
                  </Button>
                  <label className={`cursor-pointer inline-flex items-center justify-center gap-1.5 h-11 px-3 text-sm font-semibold rounded-xl transition-colors duration-150 ${isUploadingExcel ? "opacity-40 cursor-not-allowed" : ""} bg-surface-elevated text-text-primary hover:bg-border`}>
                    {isUploadingExcel ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>업로드</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                      disabled={isUploadingExcel}
                    />
                  </label>
                  <Button variant="secondary" onClick={() => setShowImportModal(true)} className="text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    <span>가져오기</span>
                  </Button>
                  <Button onClick={() => openEventModal()} className="text-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    <span>추가</span>
                  </Button>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedEventIds.size > 0 && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-primary">
                    {selectedEventIds.size}개 선택됨
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEventIds(new Set())}
                      className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      선택 해제
                    </button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkDeleteEvents}
                      disabled={isDeletingBulk}
                      className="bg-error/10 text-error hover:bg-error/20 border-error/20"
                    >
                      {isDeletingBulk ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mr-1" />
                          삭제 중...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          선택 삭제
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Excel Upload Result */}
              {excelUploadResult && (
                <div className={`rounded-xl px-4 py-3 ${excelUploadResult.failed > 0 ? "bg-warning/10 border border-warning/20" : "bg-success/10 border border-success/20"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${excelUploadResult.failed > 0 ? "text-warning" : "text-success"}`}>
                        엑셀 업로드 완료: {excelUploadResult.success}개 성공
                        {excelUploadResult.failed > 0 && `, ${excelUploadResult.failed}개 실패`}
                      </p>
                      {excelUploadResult.errors.length > 0 && (
                        <ul className="mt-1 text-sm text-text-secondary">
                          {excelUploadResult.errors.slice(0, 3).map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                          {excelUploadResult.errors.length > 3 && (
                            <li>... 외 {excelUploadResult.errors.length - 3}개 오류</li>
                          )}
                        </ul>
                      )}
                    </div>
                    <button
                      onClick={() => setExcelUploadResult(null)}
                      className="text-text-tertiary hover:text-text-primary p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 ? (
                <Card className="p-8">
                  <p className="text-center text-text-tertiary">대회가 없습니다</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredEvents.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleEventSelection(event.id)}
                            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
                              selectedEventIds.has(event.id)
                                ? "bg-primary border-primary text-white"
                                : "border-border hover:border-text-secondary"
                            }`}
                          >
                            {selectedEventIds.has(event.id) && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-text-primary">{event.name}</span>
                              {event.isOfficial && (
                                <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">공식</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {event.region === "international" ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">해외</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">국내</span>
                              )}
                              {event.courses && (
                                <span className="text-xs text-text-secondary">{event.courses}</span>
                              )}
                            </div>
                            <div className="text-sm text-text-secondary mb-2">
                              {event.location && <span>{event.location}</span>}
                              {event.location && event.date && <span className="mx-1">·</span>}
                              {event.date && <span>{formatDate(event.date)}</span>}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-tertiary">기록 {event._count.runningLogs}개</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEventModal(event)}
                                  className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  disabled={deletingEventId === event.id}
                                  className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {deletingEventId === event.id ? (
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary w-10">
                              <button
                                onClick={toggleAllEvents}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  selectedEventIds.size === filteredEvents.length && filteredEvents.length > 0
                                    ? "bg-primary border-primary text-white"
                                    : selectedEventIds.size > 0
                                    ? "bg-primary/50 border-primary text-white"
                                    : "border-border hover:border-text-secondary"
                                }`}
                              >
                                {selectedEventIds.size > 0 && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">대회명</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">지역</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">장소</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">종목</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">날짜</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">기록</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEvents.map((event) => (
                            <tr
                              key={event.id}
                              className="border-b border-border last:border-b-0 hover:bg-surface-elevated transition-colors"
                            >
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => toggleEventSelection(event.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    selectedEventIds.has(event.id)
                                      ? "bg-primary border-primary text-white"
                                      : "border-border hover:border-text-secondary"
                                  }`}
                                >
                                  {selectedEventIds.has(event.id) && (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-text-primary">{event.name}</span>
                                  {event.isOfficial && (
                                    <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">공식</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {event.region === "international" ? (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">해외</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">국내</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary">{event.location || "-"}</td>
                              <td className="px-4 py-3 text-sm text-text-primary">{event.courses || "-"}</td>
                              <td className="px-4 py-3 text-sm text-text-tertiary">{formatDate(event.date)}</td>
                              <td className="px-4 py-3 text-center text-sm text-text-secondary">{event._count.runningLogs}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEventModal(event)}
                                    className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    disabled={deletingEventId === event.id}
                                    className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {deletingEventId === event.id ? (
                                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Rankings View */}
          {activeView === "rankings" && (
            <div className="space-y-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedRankingCrew("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRankingCrew === "all"
                      ? "bg-primary text-white"
                      : "bg-surface-elevated text-text-secondary hover:bg-border"
                  }`}
                >
                  전체
                </button>
                {crews.map((crew) => (
                  <button
                    key={crew.id}
                    onClick={() => setSelectedRankingCrew(crew.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedRankingCrew === crew.id
                        ? "bg-primary text-white"
                        : "bg-surface-elevated text-text-secondary hover:bg-border"
                    }`}
                  >
                    {crew.name}
                  </button>
                ))}
              </div>

              {filteredRankings.length === 0 ? (
                <Card className="p-8">
                  <p className="text-center text-text-tertiary">랭킹 데이터가 없습니다</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredRankings.map((rank, index) => (
                      <Card
                        key={rank.userId}
                        onClick={() => openUserDetail(rank.userId)}
                        className="p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-600" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-surface-elevated text-text-tertiary"
                          }`}>
                            {index < 3 ? (
                              <Medal className="w-5 h-5" />
                            ) : (
                              <span className="text-sm">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {rank.userImage ? (
                                <Image src={rank.userImage} alt="" width={28} height={28} className="rounded-full" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary text-xs font-medium">
                                  {rank.userName?.[0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <span className="font-medium text-text-primary truncate">{rank.userName}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-bold text-primary">{rank.totalDistance.toFixed(1)} km</span>
                              <span className="text-xs text-text-tertiary">{formatDuration(rank.totalDuration)}</span>
                              <span className="text-xs text-text-tertiary">{rank.totalRuns}회</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary w-16">순위</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">사용자</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">총 거리</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">총 시간</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">러닝 횟수</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRankings.map((rank, index) => (
                            <tr
                              key={rank.userId}
                              onClick={() => openUserDetail(rank.userId)}
                              className="border-b border-border last:border-b-0 hover:bg-surface-elevated cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto ${
                                  index === 0 ? "bg-yellow-100 text-yellow-700" :
                                  index === 1 ? "bg-gray-100 text-gray-600" :
                                  index === 2 ? "bg-orange-100 text-orange-700" :
                                  "bg-surface-elevated text-text-tertiary"
                                }`}>
                                  {index < 3 ? (
                                    <Medal className="w-4 h-4" />
                                  ) : (
                                    <span className="text-sm">{index + 1}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {rank.userImage ? (
                                    <Image src={rank.userImage} alt="" width={36} height={36} className="rounded-full" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                                      {rank.userName?.[0]?.toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-text-primary">{rank.userName}</span>
                                    <p className="text-xs text-text-tertiary">{rank.userEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-primary">{rank.totalDistance.toFixed(3)} km</td>
                              <td className="px-4 py-3 text-right text-sm font-mono text-text-secondary">{formatDuration(rank.totalDuration)}</td>
                              <td className="px-4 py-3 text-center text-sm text-text-secondary">{rank.totalRuns}회</td>
                              <td className="px-4 py-3 text-center">
                                <ChevronRight className="w-4 h-4 text-text-tertiary inline-block" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Pace Groups View */}
          {activeView === "pace-groups" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleSeedPaceGroups} disabled={isSeedingPaceGroups}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${isSeedingPaceGroups ? "animate-spin" : ""}`} />
                  {isSeedingPaceGroups ? "초기화 중..." : "초기 데이터 설정"}
                </Button>
                <Button onClick={() => openPaceGroupModal()}>
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>

              {paceGroups.length === 0 ? (
                <Card className="text-center py-12">
                  <Gauge className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary mb-2">페이스 그룹이 없습니다</p>
                  <p className="text-sm text-text-tertiary">초기 데이터 설정 버튼을 눌러 10개 그룹을 생성하세요</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {paceGroups.map((group) => (
                      <Card key={group.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-primary">{group.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openPaceGroupModal(group)}
                              className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePaceGroup(group.id)}
                              disabled={deletingPaceGroupId === group.id}
                              className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {deletingPaceGroupId === group.id ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-text-tertiary mb-1">목표 시간</p>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-xs text-text-tertiary">Full</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.timeFull)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">Half</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.timeHalf)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">10K</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.time10k)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">5K</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.time5k)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-border pt-3">
                            <p className="text-xs text-text-tertiary mb-1">페이스 (분/km)</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-xs text-text-tertiary">Full</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.paceFull)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">Half</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.paceHalf)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">10K</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.pace10k)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">5K</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.pace5k)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-tertiary">1km</p>
                                <p className="font-mono text-sm text-text-primary">{secondsToTimeStr(group.pace1km)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-primary font-medium">Rec.</p>
                                <p className="font-mono text-sm text-primary font-medium">{secondsToTimeStr(group.paceRecovery)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary sticky left-0 bg-surface-elevated">그룹</th>
                            <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary" colSpan={4}>목표 시간</th>
                            <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary" colSpan={6}>페이스</th>
                            <th className="text-center px-3 py-3 text-sm font-medium text-text-secondary">작업</th>
                          </tr>
                          <tr className="bg-surface-elevated/50 border-b border-border">
                            <th className="text-left px-4 py-2 text-xs font-medium text-text-tertiary sticky left-0 bg-surface-elevated/50"></th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">Full</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">Half</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">10K</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">5K</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">Full</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">Half</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">10K</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">5K</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary">1km</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-primary">Rec.</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-text-tertiary"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {paceGroups.map((group, index) => (
                            <tr
                              key={group.id}
                              className={`border-b border-border last:border-b-0 ${
                                index % 2 === 0 ? "bg-surface" : "bg-surface-elevated/50"
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-text-primary sticky left-0 bg-inherit">
                                {group.name}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.timeFull)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.timeHalf)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.time10k)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.time5k)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.paceFull)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.paceHalf)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.pace10k)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.pace5k)}
                              </td>
                              <td className="px-3 py-3 text-center text-text-secondary font-mono text-sm">
                                {secondsToTimeStr(group.pace1km)}
                              </td>
                              <td className="px-3 py-3 text-center text-primary font-mono text-sm font-medium">
                                {secondsToTimeStr(group.paceRecovery)}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openPaceGroupModal(group)}
                                    className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePaceGroup(group.id)}
                                    disabled={deletingPaceGroupId === group.id}
                                    className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {deletingPaceGroupId === group.id ? (
                                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}

              <Card className="p-4">
                <h3 className="font-medium text-text-primary mb-2">페이스 가이드</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• <span className="font-medium">목표 시간</span>: 각 거리별 목표 완주 시간</li>
                  <li>• <span className="font-medium">페이스</span>: 해당 거리 레이스 권장 페이스 (분/km)</li>
                  <li>• <span className="font-medium">1km</span>: 인터벌 훈련 페이스</li>
                  <li>• <span className="text-primary font-medium">Recovery</span>: 회복 조깅 페이스</li>
                </ul>
              </Card>
            </div>
          )}

          {/* Access Logs View */}
          {activeView === "access-logs" && (
            <div className="space-y-4">
              {accessLogs.length === 0 ? (
                <Card className="text-center py-12">
                  <History className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary">접속 기록이 없습니다</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {accessLogs.map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {log.user.image ? (
                            <Image src={log.user.image} alt="" width={40} height={40} className="rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                              {log.user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary truncate">{log.user.name || log.user.email}</p>
                            <p className="text-xs text-text-tertiary">{log.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === "login" ? "bg-success/10 text-success" :
                            log.action === "logout" ? "bg-warning/10 text-warning" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {log.action === "login" ? "로그인" : log.action === "logout" ? "로그아웃" : log.action}
                          </span>
                          <span className="text-text-tertiary">{formatRelativeTime(new Date(log.createdAt))}</span>
                        </div>
                        {(log.ipAddress || (log.metadata as { location?: string } | null)?.location) && (
                          <div className="mt-2 pt-2 border-t border-border text-xs text-text-tertiary">
                            {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                            {(log.metadata as { location?: string } | null)?.location && (
                              <span className="ml-2">{(log.metadata as { location?: string }).location}</span>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">사용자</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">액션</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">시간</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary hidden lg:table-cell">IP / 위치</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accessLogs.map((log) => (
                            <tr
                              key={log.id}
                              onClick={() => openUserDetail(log.user.id)}
                              className="border-b border-border last:border-b-0 hover:bg-surface-elevated cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {log.user.image ? (
                                    <Image src={log.user.image} alt="" width={36} height={36} className="rounded-full" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                                      {log.user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-text-primary">{log.user.name || "Unknown"}</span>
                                    <p className="text-xs text-text-tertiary">{log.user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.action === "login" ? "bg-success/10 text-success" :
                                  log.action === "logout" ? "bg-warning/10 text-warning" :
                                  "bg-primary/10 text-primary"
                                }`}>
                                  {log.action === "login" ? "로그인" : log.action === "logout" ? "로그아웃" : log.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary">{formatRelativeTime(new Date(log.createdAt))}</td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <div className="text-sm font-mono text-text-tertiary">{log.ipAddress || "-"}</div>
                                {(log.metadata as { location?: string } | null)?.location && (
                                  <div className="text-xs text-text-tertiary mt-0.5">
                                    {(log.metadata as { location?: string }).location}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* User Detail View */}
          {activeView === "user-detail" && selectedUser && (
            <div className="space-y-6">
              <button
                onClick={() => navigateTo("users")}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">사용자 목록으로</span>
              </button>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  {selectedUser.image ? (
                    <Image src={selectedUser.image} alt="" width={80} height={80} className="rounded-full" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-xl font-bold text-text-primary">{selectedUser.name || "Unknown"}</h2>
                      {selectedUser.role === "admin" && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">Admin</span>
                      )}
                      {getProviderBadge(selectedUser.accounts)}
                    </div>
                    <p className="text-text-tertiary flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </p>
                    <p className="text-sm text-text-tertiary mt-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      가입일: {formatDate(selectedUser.createdAt)}
                    </p>
                    <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      마지막 접속: {selectedUser.lastAccessedAt ? formatRelativeTime(new Date(selectedUser.lastAccessedAt)) : "정보 없음"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6 flex-wrap">
                  {selectedUser.role === "admin" ? (
                    <Button
                      variant="secondary"
                      onClick={() => handlePromoteUser(selectedUser.id, "user")}
                      disabled={promotingUserId === selectedUser.id}
                      className="text-error"
                    >
                      <ShieldOff className="w-4 h-4 mr-1" />
                      {promotingUserId === selectedUser.id ? "처리 중..." : "관리자 권한 해제"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePromoteUser(selectedUser.id, "admin")}
                      disabled={promotingUserId === selectedUser.id}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      {promotingUserId === selectedUser.id ? "처리 중..." : "관리자로 승격"}
                    </Button>
                  )}
                  {selectedUser.id !== currentUserId && (
                    <Button
                      variant="secondary"
                      onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                      disabled={deletingUserId === selectedUser.id}
                      className="text-error border-error/20 hover:bg-error/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deletingUserId === selectedUser.id ? "삭제 중..." : "계정 삭제"}
                    </Button>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-text-primary">{selectedUser._count.runningLogs}</p>
                  <p className="text-sm text-text-tertiary">러닝 기록</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-text-primary">{selectedUser._count.crews}</p>
                  <p className="text-sm text-text-tertiary">가입 크루</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-text-primary">{selectedUser._count.ownedCrews}</p>
                  <p className="text-sm text-text-tertiary">운영 크루</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-primary">{userAccessLogs.length}</p>
                  <p className="text-sm text-text-tertiary">접속 로그</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-primary">{sortedUserPageViews.length}</p>
                  <p className="text-sm text-text-tertiary">방문 페이지</p>
                </Card>
              </div>

              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">러닝 기록</h3>
                <Card className="divide-y divide-border">
                  {userRecords.length === 0 ? (
                    <p className="text-center text-text-tertiary py-8">기록이 없습니다</p>
                  ) : (
                    userRecords.map((record) => (
                      <div key={record.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-text-primary">{record.event?.name || "개인 기록"}</p>
                          <p className="text-sm text-text-tertiary">{formatDate(record.date)}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-text-secondary">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {record.distance.toFixed(2)}km
                          </span>
                          <span className="text-text-secondary">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatDuration(record.duration)}
                          </span>
                          <span className="text-text-secondary">
                            페이스: {formatPace(record.pace)}/km
                          </span>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-text-tertiary mt-2">{record.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </Card>
              </section>

              {/* 페이지 뷰 통계 */}
              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  <BarChart3 className="w-5 h-5 inline mr-2" />
                  페이지 뷰 통계
                </h3>
                <Card className="divide-y divide-border">
                  {sortedUserPageViews.length === 0 ? (
                    <p className="text-center text-text-tertiary py-8">페이지 뷰 기록이 없습니다</p>
                  ) : (
                    sortedUserPageViews.slice(0, 10).map(([path, count]) => (
                      <div key={path} className="p-3 flex items-center justify-between">
                        <span className="text-text-primary font-mono text-sm">{path}</span>
                        <span className="text-text-secondary text-sm font-medium">{count}회</span>
                      </div>
                    ))
                  )}
                </Card>
              </section>

              {/* 접속 로그 */}
              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  <History className="w-5 h-5 inline mr-2" />
                  최근 접속 로그 ({userAccessLogs.length}개)
                </h3>
                <Card className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {userAccessLogs.length === 0 ? (
                    <p className="text-center text-text-tertiary py-8">접속 기록이 없습니다</p>
                  ) : (
                    userAccessLogs.slice(0, 50).map((log) => (
                      <div key={log.id} className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">
                            {log.action === "page_view" ? "페이지 방문" : log.action}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {formatRelativeTime(new Date(log.createdAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-tertiary">
                          {log.path && <span className="font-mono">{log.path}</span>}
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          {log.metadata?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {String(log.metadata.location)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              </section>

            </div>
          )}

          {/* Crew Detail View */}
          {activeView === "crew-detail" && selectedCrew && (
            <div className="space-y-6">
              <button
                onClick={() => navigateTo("crews")}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">크루 목록으로</span>
              </button>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold">
                    {selectedCrew.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-text-primary">{selectedCrew.name}</h2>
                      {selectedCrew.isPublic ? (
                        <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          공개
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-medium rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          비공개
                        </span>
                      )}
                    </div>
                    {selectedCrew.description && (
                      <p className="text-text-secondary">{selectedCrew.description}</p>
                    )}
                    <p className="text-sm text-text-tertiary mt-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      생성일: {formatDate(selectedCrew.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-text-primary">{selectedCrew._count.members}</p>
                  <p className="text-sm text-text-tertiary">멤버 수</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-text-primary">
                    {selectedCrew.isPublic ? "공개" : "비공개"}
                  </p>
                  <p className="text-sm text-text-tertiary">공개 상태</p>
                </Card>
              </div>

              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">크루장</h3>
                <Card
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
                  onClick={() => openUserDetail(selectedCrew.owner.id)}
                >
                  {selectedCrew.owner.image ? (
                    <Image src={selectedCrew.owner.image} alt="" width={48} height={48} className="rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {selectedCrew.owner.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{selectedCrew.owner.name || "Unknown"}</p>
                    <p className="text-sm text-text-tertiary">{selectedCrew.owner.email}</p>
                  </div>
                  <Crown className="w-5 h-5 text-warning" />
                </Card>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  멤버 ({selectedCrew.members.length}명)
                </h3>
                <Card className="divide-y divide-border">
                  {selectedCrew.members.length === 0 ? (
                    <p className="text-center text-text-tertiary py-8">멤버가 없습니다</p>
                  ) : (
                    selectedCrew.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
                        onClick={() => openUserDetail(member.user.id)}
                      >
                        {member.user.image ? (
                          <Image src={member.user.image} alt="" width={40} height={40} className="rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                            {member.user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{member.user.name || "Unknown"}</p>
                          <p className="text-sm text-text-tertiary">{member.user.email}</p>
                        </div>
                        <div className="text-right">
                          {member.user.id === selectedCrew.ownerId ? (
                            <Crown className="w-5 h-5 text-warning" />
                          ) : (
                            <span className="text-xs text-text-tertiary">
                              {member.role === "admin" ? "관리자" : "멤버"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
