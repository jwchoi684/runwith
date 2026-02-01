"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "filled" | "underline";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, variant = "default", className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    const variantStyles = {
      default: `
        bg-surface-elevated border border-border
        focus:border-primary focus:ring-2 focus:ring-primary/20
        rounded-[--radius-lg]
      `,
      filled: `
        bg-surface-elevated border-0
        focus:ring-2 focus:ring-primary/20
        rounded-[--radius-lg]
      `,
      underline: `
        bg-transparent border-0 border-b-2 border-border
        focus:border-primary
        rounded-none px-0
      `,
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-text-tertiary mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-12 px-4
            text-[15px] text-text-primary placeholder:text-text-disabled
            focus:outline-none
            disabled:bg-border-light disabled:text-text-disabled disabled:cursor-not-allowed
            transition-all duration-150
            ${variantStyles[variant]}
            ${error ? "border-error! focus:ring-error/20!" : ""}
            ${className}
          `}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={`mt-2 text-[13px] ${
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

// Toss-style Search Input
interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", onClear, value, ...props }, ref) => {
    return (
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={ref}
          type="text"
          value={value}
          className={`
            w-full h-11 pl-11 pr-10
            bg-surface-elevated
            text-[15px] text-text-primary placeholder:text-text-tertiary
            rounded-[--radius-lg]
            focus:outline-none focus:ring-2 focus:ring-primary/20
            transition-all duration-150
            ${className}
          `}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-text-tertiary/30 flex items-center justify-center hover:bg-text-tertiary/50 transition-colors"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Toss-style Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-medium text-text-tertiary mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full h-12 px-4 pr-10
              bg-surface-elevated border border-border
              text-[15px] text-text-primary
              rounded-[--radius-lg]
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              disabled:bg-border-light disabled:text-text-disabled disabled:cursor-not-allowed
              appearance-none cursor-pointer
              transition-all duration-150
              ${error ? "border-error! focus:ring-error/20!" : ""}
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p className="mt-2 text-[13px] text-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
