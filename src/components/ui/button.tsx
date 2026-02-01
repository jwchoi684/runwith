"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark",
  secondary:
    "bg-surface-elevated text-text-primary hover:bg-border active:bg-border",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-elevated active:bg-surface-elevated",
  danger: "bg-error text-white hover:opacity-90 active:opacity-80",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-[--radius-md]",
  md: "h-12 px-6 text-base rounded-[--radius-lg]",
  lg: "h-14 px-8 text-lg rounded-[--radius-lg]",
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
          inline-flex items-center justify-center font-semibold
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
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
