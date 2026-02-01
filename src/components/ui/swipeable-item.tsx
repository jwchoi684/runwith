"use client";

import { useState, useRef, ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: ReactNode;
  onDelete?: () => void;
  onClick?: () => void;
  deleteLabel?: string;
  disabled?: boolean;
  isDeleting?: boolean;
}

export function SwipeableItem({
  children,
  onDelete,
  onClick,
  deleteLabel = "삭제",
  disabled = false,
  isDeleting = false,
}: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const DELETE_THRESHOLD = -80;
  const MAX_SWIPE = -100;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const diff = e.touches[0].clientX - startXRef.current;
    let newTranslate = currentXRef.current + diff;

    // Limit swipe range
    if (newTranslate > 0) newTranslate = 0;
    if (newTranslate < MAX_SWIPE) newTranslate = MAX_SWIPE;

    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to open or closed
    if (translateX < DELETE_THRESHOLD / 2) {
      setTranslateX(DELETE_THRESHOLD);
    } else {
      setTranslateX(0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If swiped, close it first
    if (translateX !== 0) {
      e.preventDefault();
      e.stopPropagation();
      setTranslateX(0);
      return;
    }

    // Only trigger onClick if not swiped
    if (onClick) {
      onClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && !isDeleting) {
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl" ref={containerRef}>
      {/* Delete Background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-error"
        style={{ width: Math.abs(DELETE_THRESHOLD) + 20 }}
      >
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-full px-6 flex flex-col items-center justify-center text-white disabled:opacity-50"
        >
          {isDeleting ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              <span className="text-xs mt-1">{deleteLabel}</span>
            </>
          )}
        </button>
      </div>

      {/* Swipeable Content */}
      <div
        className="relative bg-surface transition-transform cursor-pointer"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isDragging ? "0ms" : "200ms",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}
