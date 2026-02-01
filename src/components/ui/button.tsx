"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "dark";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark border border-primary",
  secondary: "bg-surface text-text-secondary hover:bg-surface-hover border border-border",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-hover border border-transparent",
  danger: "bg-error text-white hover:bg-red-600 border border-error",
  outline: "bg-transparent text-primary hover:bg-primary-light border border-primary",
  dark: "bg-text-primary text-white hover:bg-gray-800 border border-text-primary",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[12px] font-medium rounded-[--radius-sm] gap-1",
  sm: "h-8 px-3 text-[13px] font-medium rounded-[--radius-md] gap-1.5",
  md: "h-10 px-4 text-[14px] font-medium rounded-[--radius-md] gap-2",
  lg: "h-12 px-5 text-[15px] font-semibold rounded-[--radius-lg] gap-2",
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
          inline-flex items-center justify-center
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// Deel-style Icon Button
interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost";
}

const iconButtonSizes = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-10 h-10",
};

const iconButtonVariants = {
  default: "bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:border-border-dark",
  ghost: "bg-transparent border border-transparent text-text-secondary hover:bg-surface-hover",
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
          rounded-[--radius-md]
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
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

// Deel-style Action Button (small outlined)
interface ActionButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: "default" | "primary";
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
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
          h-8 px-3
          text-[13px] font-medium
          rounded-[--radius-md]
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variant === "primary"
            ? "bg-text-primary text-white border border-text-primary hover:bg-gray-800"
            : "bg-surface text-text-secondary border border-border hover:bg-surface-hover hover:border-border-dark"
          }
          ${className}
        `}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

ActionButton.displayName = "ActionButton";
