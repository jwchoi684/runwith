"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

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
            className="block text-[13px] font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-10 px-3
            bg-surface border border-border
            rounded-[--radius-md]
            text-[14px] text-text-primary placeholder:text-text-disabled
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-surface-secondary disabled:text-text-disabled disabled:cursor-not-allowed
            transition-all duration-150
            ${error ? "border-error focus:border-error focus:ring-error" : ""}
            ${className}
          `}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={`mt-1.5 text-[12px] ${
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

// Deel-style Search Input
interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", onClear, value, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          ref={ref}
          type="text"
          value={value}
          className={`
            w-full h-10 pl-9 pr-9
            bg-surface border border-border
            text-[14px] text-text-primary placeholder:text-text-tertiary
            rounded-[--radius-md]
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            transition-all duration-150
            ${className}
          `}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-text-tertiary/40 flex items-center justify-center hover:bg-text-tertiary/60 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Deel-style Select
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
            className="block text-[13px] font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full h-10 px-3 pr-8
              bg-surface border border-border
              text-[14px] text-text-primary
              rounded-[--radius-md]
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
              disabled:bg-surface-secondary disabled:text-text-disabled disabled:cursor-not-allowed
              appearance-none cursor-pointer
              transition-all duration-150
              ${error ? "border-error focus:border-error focus:ring-error" : ""}
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
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p className="mt-1.5 text-[12px] text-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

// Deel-style Filter Dropdown
interface FilterDropdownProps {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  className?: string;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className = "",
}: FilterDropdownProps) {
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          appearance-none
          h-9 pl-3 pr-7
          bg-surface border border-border
          text-[13px] font-medium text-text-secondary
          rounded-[--radius-md]
          cursor-pointer
          hover:bg-surface-hover hover:border-border-dark
          focus:outline-none focus:border-primary
          transition-all duration-150
        "
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
