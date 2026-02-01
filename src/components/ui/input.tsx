"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-12 px-4
            bg-surface-elevated border border-border
            rounded-[--radius-lg]
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? "border-error focus:ring-error" : ""}
            ${className}
          `}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={`mt-1.5 text-sm ${
              error ? "text-error" : "text-text-tertiary"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
