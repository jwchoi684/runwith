"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "interactive" | "outline" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-surface shadow-toss",
  elevated: "bg-surface shadow-toss-lg",
  interactive: "bg-surface shadow-toss hover:shadow-toss-lg active:bg-surface-elevated cursor-pointer",
  outline: "bg-surface border border-border",
  flat: "bg-surface",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
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
          rounded-[--radius-xl]
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        whileTap={isInteractive ? { scale: 0.985 } : undefined}
        transition={{ duration: 0.12 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div>
        <h3 className="text-[17px] font-bold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-[13px] text-text-tertiary mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}

// New: Toss-style list card for transactions/items
interface ListCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ListCard({ children, className = "" }: ListCardProps) {
  return (
    <div className={`bg-surface rounded-[--radius-xl] shadow-toss overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface ListCardItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: "default" | "primary" | "success" | "error" | "warning";
  subValue?: string;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

const valueColorStyles = {
  default: "text-text-primary",
  primary: "text-primary",
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
};

export function ListCardItem({
  icon,
  title,
  subtitle,
  value,
  valueColor = "default",
  subValue,
  onClick,
  showChevron = false,
  className = "",
}: ListCardItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-4
        border-b border-border-light last:border-b-0
        transition-colors duration-150
        ${onClick ? "hover:bg-surface-elevated active:bg-surface-hover cursor-pointer text-left" : ""}
        ${className}
      `}
    >
      {icon && (
        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[15px] text-text-primary truncate">{title}</p>
        {subtitle && (
          <p className="text-[13px] text-text-tertiary mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {(value || showChevron) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {value && (
            <div className="text-right">
              <p className={`font-bold text-[16px] tabular-nums ${valueColorStyles[valueColor]}`}>
                {value}
              </p>
              {subValue && (
                <p className="text-[12px] text-text-tertiary tabular-nums">{subValue}</p>
              )}
            </div>
          )}
          {showChevron && (
            <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      )}
    </Component>
  );
}
