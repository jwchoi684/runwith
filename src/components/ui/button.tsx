"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "pill" | "pill-primary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark",
  secondary: "bg-surface-elevated text-text-primary hover:bg-border active:bg-border",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-elevated active:bg-border",
  danger: "bg-error text-white hover:opacity-90 active:opacity-80",
  outline: "bg-transparent border border-border text-text-primary hover:bg-surface-elevated active:bg-border",
  pill: "bg-surface-elevated text-text-primary hover:bg-border active:bg-border rounded-full!",
  "pill-primary": "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark rounded-full!",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] font-medium rounded-[--radius-md]",
  md: "h-11 px-5 text-[14px] font-semibold rounded-[--radius-lg]",
  lg: "h-13 px-6 text-[15px] font-semibold rounded-[--radius-xl]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-1.5
          transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// Toss-style icon button
interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "primary";
}

const iconButtonSizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconButtonVariants = {
  default: "bg-surface-elevated text-text-secondary hover:bg-border",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-elevated",
  primary: "bg-primary-light text-primary hover:bg-primary/20",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      size = "md",
      variant = "default",
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center
          rounded-full
          transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          ${iconButtonSizes[size]}
          ${iconButtonVariants[variant]}
          ${className}
        `}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";
