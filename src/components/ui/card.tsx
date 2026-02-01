"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "bordered" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-surface border border-border",
  bordered: "bg-surface border border-border",
  elevated: "bg-surface border border-border shadow-card",
  interactive: "bg-surface border border-border hover:border-border-dark hover:shadow-card cursor-pointer",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === "interactive";

    return (
      <motion.div
        ref={ref}
        className={`
          rounded-[--radius-lg]
          transition-all duration-150
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        whileTap={isInteractive ? { scale: 0.995 } : undefined}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

// Deel-style Section Header
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-[13px] text-text-tertiary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Deel-style Info Row
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function InfoRow({ label, value, className = "" }: InfoRowProps) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-border-light last:border-b-0 ${className}`}>
      <span className="text-[14px] text-text-secondary">{label}</span>
      <span className="text-[14px] font-medium text-text-primary">{value}</span>
    </div>
  );
}

// Deel-style List Card
interface ListCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ListCard({ children, className = "" }: ListCardProps) {
  return (
    <div className={`bg-surface border border-border rounded-[--radius-lg] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// Deel-style List Item
interface ListItemProps {
  icon?: React.ReactNode;
  avatar?: string | null;
  initials?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListItem({
  icon,
  avatar,
  initials,
  title,
  subtitle,
  value,
  action,
  onClick,
  className = "",
}: ListItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3
        border-b border-border-light last:border-b-0
        transition-colors duration-150
        ${onClick ? "hover:bg-surface-hover cursor-pointer text-left" : ""}
        ${className}
      `}
    >
      {/* Avatar/Icon */}
      {(icon || avatar || initials) && (
        <div className="flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : icon ? (
            <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
              {icon}
            </div>
          ) : initials ? (
            <div className="w-9 h-9 rounded-full bg-accent-light text-accent font-semibold text-sm flex items-center justify-center">
              {initials}
            </div>
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text-primary truncate">{title}</p>
        {subtitle && (
          <p className="text-[13px] text-text-tertiary truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Value/Action */}
      {value && (
        <div className="flex-shrink-0 text-right">
          {value}
        </div>
      )}
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </Component>
  );
}

// Deel-style Stat Card
interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  onClick,
  className = "",
}: StatCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`
        bg-surface border border-border rounded-[--radius-lg] p-4
        text-left transition-all duration-150
        ${onClick ? "hover:border-border-dark hover:shadow-card cursor-pointer" : ""}
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
            {icon}
          </div>
        )}
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.isPositive ? "bg-success-light text-success" : "bg-error-light text-error"
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-[13px] text-text-tertiary mb-1">{label}</p>
      <p className="text-[22px] font-bold text-text-primary tabular-nums">{value}</p>
    </Component>
  );
}
