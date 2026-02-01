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

interface Stats {
  totalUsers: number;
  totalRecords: number;
  totalCrews: number;
  totalEvents: number;
  dau: number;
  mau: number;
}

interface AdminDashboardProps {
  users: User[];
  stats: Stats;
  recentRecords: RunningLog[];
  crews: Crew[];
  events: MarathonEvent[];
  rankings: Ranking[];
  crewMembers: CrewMemberMapping[];
  currentUserId: string;
}

type View = "dashboard" | "users" | "records" | "crews" | "events" | "rankings" | "user-detail" | "crew-detail";

const distancePresets = [
  { label: "5K", value: 5 },
  { label: "10K", value: 10 },
  { label: "하프", value: 21.0975 },
  { label: "풀마라톤", value: 42.195 },
];

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
    distance: "42.195",
    courses: [] as string[],
    date: "",
    isOfficial: true,
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Import events state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [scrapedEvents, setScrapedEvents] = useState<ScrapedEvent[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedCrew = crews.find((c) => c.id === selectedCrewId);
  const userRecords = recentRecords.filter((r) => r.user.id === selectedUserId);

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
      setEventForm({
        name: event.name,
        location: event.location || "",
        distance: event.distance.toString(),
        courses: event.courses ? event.courses.split(",") : [],
        date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
        isOfficial: event.isOfficial,
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        name: "",
        location: "",
        distance: "42.195",
        courses: [],
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

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventForm.name.trim(),
          location: eventForm.location.trim() || null,
          distance: parseFloat(eventForm.distance),
          courses: eventForm.courses.length > 0 ? eventForm.courses.join(",") : null,
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

  const formatDistance = (distance: number) => {
    if (distance === 42.195) return "풀마라톤";
    if (distance === 21.0975) return "하프";
    if (distance === 10) return "10K";
    if (distance === 5) return "5K";
    return `${distance}km`;
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

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCrews = crews.filter(
    (crew) =>
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.owner.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    { id: "rankings" as View, label: "Ranking", icon: BarChart3 },
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
                <label className="text-sm font-medium text-text-secondary">코스 선택</label>
                <div className="flex gap-2 mt-1">
                  {(["Full", "Half", "10km", "5km"] as const).map((course) => (
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
                <label className="text-sm font-medium text-text-secondary">대표 거리</label>
                <div className="flex gap-2 mt-1">
                  {distancePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, distance: preset.value.toString() })}
                      className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        parseFloat(eventForm.distance) === preset.value
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-surface-elevated border-border text-text-secondary hover:border-text-secondary"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-text-secondary">
                      총 {scrapedEvents.length}개 대회 (새로운 대회: {scrapedEvents.filter(e => !e.alreadyExists).length}개)
                    </span>
                    <button
                      onClick={() => {
                        const newIds = scrapedEvents
                          .filter(e => !e.alreadyExists)
                          .map(e => e.externalId);
                        setSelectedImportIds(new Set(newIds));
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      새 대회만 선택
                    </button>
                  </div>
                  {scrapedEvents.map((event) => (
                    <div
                      key={event.externalId}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        event.alreadyExists ? "border-border bg-surface-elevated opacity-50" : "border-border"
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (event.alreadyExists) return;
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
                        disabled={event.alreadyExists}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                          selectedImportIds.has(event.externalId)
                            ? "bg-primary border-primary text-white"
                            : event.alreadyExists
                            ? "border-border bg-surface-elevated"
                            : "border-border hover:border-text-secondary"
                        }`}
                      >
                        {selectedImportIds.has(event.externalId) && (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {event.name}
                          {event.alreadyExists && (
                            <span className="ml-2 text-xs text-text-tertiary">(이미 등록됨)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-text-tertiary">
                          <span>{event.date}</span>
                          {event.location && <span>{event.location}</span>}
                          <span>{event.courses.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
            <div className="space-y-6">
              {/* DAU/MAU Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{stats.dau}</p>
                      <p className="text-sm text-text-tertiary">DAU (오늘)</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{stats.mau}</p>
                      <p className="text-sm text-text-tertiary">MAU (이번 달)</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
                <Card className="text-center py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("users")}>
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
                  <p className="text-sm text-text-tertiary">전체 사용자</p>
                </Card>
                <Card className="text-center py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("records")}>
                  <FileText className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-primary">{stats.totalRecords}</p>
                  <p className="text-sm text-text-tertiary">전체 기록</p>
                </Card>
                <Card className="text-center py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("crews")}>
                  <Users2 className="w-8 h-8 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-primary">{stats.totalCrews}</p>
                  <p className="text-sm text-text-tertiary">전체 크루</p>
                </Card>
                <Card className="text-center py-6 cursor-pointer hover:shadow-toss-lg transition-shadow" onClick={() => navigateTo("events")}>
                  <Trophy className="w-8 h-8 text-error mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-primary">{stats.totalEvents}</p>
                  <p className="text-sm text-text-tertiary">마라톤 대회</p>
                </Card>
              </div>

              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-3">최근 기록</h2>
                <Card className="divide-y divide-border">
                  {recentRecords.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
                      onClick={() => openUserDetail(record.user.id)}
                    >
                      {record.user.image ? (
                        <Image src={record.user.image} alt="" width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                          {record.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{record.user.name || record.user.email}</p>
                        <p className="text-sm text-text-tertiary">{record.event?.name || "개인 기록"} · {record.distance.toFixed(2)}km</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary">{formatDuration(record.duration)}</p>
                        <p className="text-xs text-text-tertiary">{formatDate(record.date)}</p>
                      </div>
                    </div>
                  ))}
                </Card>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-3">최근 가입 사용자</h2>
                <Card className="divide-y divide-border">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
                      onClick={() => openUserDetail(user.id)}
                    >
                      {user.image ? (
                        <Image src={user.image} alt="" width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary truncate">{user.name || "Unknown"}</p>
                          {getProviderBadge(user.accounts)}
                        </div>
                        <p className="text-sm text-text-tertiary truncate">{user.email}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-tertiary" />
                    </div>
                  ))}
                </Card>
              </section>
            </div>
          )}

          {/* Users View */}
          {activeView === "users" && (
            <div className="space-y-4">
              <div className="relative max-w-md">
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
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="bg-surface-elevated border-b border-border">
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">사용자</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">이메일</th>
                          <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">역할</th>
                          <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">기록</th>
                          <th className="text-center px-4 py-3 text-sm font-medium text-text-secondary">크루</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">가입일</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">마지막 접속</th>
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
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-text-primary">{user.name || "Unknown"}</span>
                                  {getProviderBadge(user.accounts)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">{user.email}</td>
                            <td className="px-4 py-3 text-center">
                              {user.role === "admin" ? (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Admin</span>
                              ) : (
                                <span className="text-xs text-text-tertiary">User</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-text-secondary">{user._count.runningLogs}</td>
                            <td className="px-4 py-3 text-center text-sm text-text-secondary">{user._count.crews}</td>
                            <td className="px-4 py-3 text-sm text-text-tertiary">{formatDate(user.createdAt)}</td>
                            <td className="px-4 py-3 text-sm text-text-tertiary">
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
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {recentRecords.map((record) => (
                    <Card
                      key={record.id}
                      className="flex items-center gap-3 cursor-pointer hover:shadow-toss-lg transition-all"
                      onClick={() => openUserDetail(record.user.id)}
                    >
                      {record.user.image ? (
                        <Image src={record.user.image} alt="" width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                          {record.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{record.user.name || record.user.email}</p>
                        <p className="text-sm text-text-tertiary">{record.event?.name || "개인 기록"} · {record.distance.toFixed(2)}km</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary">{formatDuration(record.duration)}</p>
                        <p className="text-xs text-text-tertiary">{formatDate(record.date)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Crews View */}
          {activeView === "crews" && (
            <div className="space-y-4">
              <div className="relative max-w-md">
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
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {filteredCrews.map((crew) => (
                    <Card
                      key={crew.id}
                      className="flex items-center gap-3 cursor-pointer hover:shadow-toss-lg transition-all"
                      onClick={() => openCrewDetail(crew.id)}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                        {crew.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary truncate">{crew.name}</p>
                          {crew.isPublic ? (
                            <Globe className="w-4 h-4 text-text-tertiary" />
                          ) : (
                            <Lock className="w-4 h-4 text-text-tertiary" />
                          )}
                        </div>
                        <p className="text-sm text-text-tertiary truncate">{crew.description || "설명 없음"}</p>
                        <p className="text-xs text-text-tertiary mt-1">
                          크루장: {crew.owner.name || crew.owner.email} · 멤버 {crew._count.members}명
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-tertiary" />
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Events View */}
          {activeView === "events" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="대회명 또는 장소로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                  <Download className="w-4 h-4 mr-1" />
                  가져오기
                </Button>
                <Button onClick={() => openEventModal()}>
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
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

              <Card className="divide-y divide-border">
                {filteredEvents.length === 0 ? (
                  <p className="text-center text-text-tertiary py-8">대회가 없습니다</p>
                ) : (
                  <>
                    {/* Select All Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-elevated">
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
                      <span className="text-sm text-text-secondary">전체 선택</span>
                    </div>

                    {filteredEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-4">
                        <button
                          onClick={() => toggleEventSelection(event.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
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
                        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                          <Trophy className="w-6 h-6 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary truncate">{event.name}</p>
                            {event.isOfficial && (
                              <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">공식</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-text-tertiary flex-wrap">
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                            <span>{formatDistance(event.distance)}</span>
                            {event.date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {formatDate(event.date)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-tertiary mt-1">
                            기록 {event._count.runningLogs}개
                          </p>
                        </div>
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
                    ))}
                  </>
                )}
              </Card>
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

              <Card className="divide-y divide-border">
                {filteredRankings.length === 0 ? (
                  <p className="text-center text-text-tertiary py-8">랭킹 데이터가 없습니다</p>
                ) : (
                  filteredRankings.map((rank, index) => (
                    <div
                      key={rank.userId}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
                      onClick={() => openUserDetail(rank.userId)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-600" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-surface-elevated text-text-tertiary"
                      }`}>
                        {index < 3 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {rank.userImage ? (
                        <Image src={rank.userImage} alt="" width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                          {rank.userName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{rank.userName}</p>
                        <p className="text-sm text-text-tertiary">
                          {rank.totalRuns}회 러닝
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{rank.totalDistance.toFixed(3)} km</p>
                        <p className="text-xs text-text-tertiary">{formatDuration(rank.totalDuration)}</p>
                      </div>
                    </div>
                  ))
                )}
              </Card>
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
