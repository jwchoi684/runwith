"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-surface",
  elevated: "bg-surface-elevated",
  interactive: "bg-surface hover:bg-surface-elevated cursor-pointer",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
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
          rounded-[--radius-lg] border border-border
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        whileTap={isInteractive ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15 }}
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
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
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
  return <div className={`mt-3 ${className}`}>{children}</div>;
}
