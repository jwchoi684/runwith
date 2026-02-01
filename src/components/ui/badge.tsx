"use client";

import { type HTMLAttributes } from "react";

// Deel-style Status Badge
type StatusType = "active" | "pending" | "inactive" | "error";

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
}

const statusStyles: Record<StatusType, { bg: string; text: string; dot: string }> = {
  active: {
    bg: "bg-success-light",
    text: "text-success",
    dot: "bg-success",
  },
  pending: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
  },
  inactive: {
    bg: "bg-surface-secondary",
    text: "text-text-tertiary",
    dot: "bg-text-tertiary",
  },
  error: {
    bg: "bg-error-light",
    text: "text-error",
    dot: "bg-error",
  },
};

const statusLabels: Record<StatusType, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  error: "Error",
};

export function StatusBadge({
  status,
  label,
  className = "",
  ...props
}: StatusBadgeProps) {
  const styles = statusStyles[status];
  const displayLabel = label || statusLabels[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        text-[12px] font-medium
        rounded-full
        ${styles.bg}
        ${styles.text}
        ${className}
      `}
      {...props}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {displayLabel}
    </span>
  );
}

// Deel-style Simple Badge
type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "accent";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const badgeVariantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-secondary text-text-secondary",
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  accent: "bg-accent-light text-accent",
};

const badgeSizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-[12px]",
};

export function Badge({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium
        rounded-full
        ${badgeVariantStyles[variant]}
        ${badgeSizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

// Deel-style Count Badge (for notifications)
interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function CountBadge({ count, max = 99, className = "" }: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-[11px] font-semibold
        rounded-full
        bg-error text-white
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}
