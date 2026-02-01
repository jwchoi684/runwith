"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Crown, LogOut, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface CrewMember {
  id: string;
  userId: string;
  role: string;
  user: User;
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  owner: User;
  members: CrewMember[];
}

interface CrewDetailProps {
  crew: Crew;
  isMember: boolean;
  isOwner: boolean;
  currentUserId?: string;
}

export function CrewDetail({ crew, isMember, isOwner, currentUserId }: CrewDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/crews/${crew.id}/members`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to join crew:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("정말 이 크루에서 나가시겠습니까?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/crews/${crew.id}/members`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/crews");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to leave crew:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 크루를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/crews/${crew.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/crews");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete crew:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/crews">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">{crew.name}</h1>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-error hover:bg-error/10"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </header>

      {/* Crew Info */}
      <Card className="text-center py-6">
        <div className="w-20 h-20 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
          {crew.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-text-primary">{crew.name}</h2>
        <p className="text-text-tertiary mt-1">
          <Users className="w-4 h-4 inline mr-1" />
          {crew.members.length}명
        </p>
        {crew.description && (
          <p className="text-text-secondary mt-3 px-4">{crew.description}</p>
        )}

        {/* Action Button */}
        <div className="mt-6">
          {!isMember ? (
            <Button onClick={handleJoin} disabled={isLoading}>
              <UserPlus className="w-4 h-4 mr-1" />
              {isLoading ? "가입 중..." : "크루 가입하기"}
            </Button>
          ) : !isOwner ? (
            <Button
              variant="secondary"
              onClick={handleLeave}
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4 mr-1" />
              {isLoading ? "나가는 중..." : "크루 나가기"}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Members */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">멤버</h3>
        <div className="space-y-2">
          {crew.members.map((member) => (
            <Card key={member.id} className="flex items-center gap-3">
              {member.user.image ? (
                <Image
                  src={member.user.image}
                  alt={member.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                  {member.user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  {member.user.name || "Unknown"}
                </p>
                <p className="text-xs text-text-tertiary">
                  {member.role === "admin" ? "관리자" : "멤버"}
                </p>
              </div>
              {member.userId === crew.ownerId && (
                <Crown className="w-5 h-5 text-warning" />
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
