"use client";

import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "outline";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-text-secondary",
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  outline: "bg-transparent border border-border text-text-secondary",
};

const sizeStyles: Record<BadgeSize, string> = {
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
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

// Toss-style status indicator dot
interface StatusDotProps {
  status: "online" | "offline" | "away" | "busy";
  size?: "sm" | "md";
}

const statusColors = {
  online: "bg-success",
  offline: "bg-text-disabled",
  away: "bg-warning",
  busy: "bg-error",
};

const dotSizes = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
};

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  return (
    <span
      className={`
        inline-block rounded-full
        ${statusColors[status]}
        ${dotSizes[size]}
      `}
    />
  );
}
