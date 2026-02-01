"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "interactive" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-surface shadow-toss",
  elevated: "bg-surface shadow-toss-lg",
  interactive: "bg-surface shadow-toss hover:shadow-toss-lg cursor-pointer",
  outline: "bg-surface border border-border",
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
          rounded-[--radius-lg]
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
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-sm text-text-tertiary mt-0.5">{subtitle}</p>
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
