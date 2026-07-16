"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "w-full h-12 appearance-none rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 text-sm text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200 hover:border-white/20",
            "cursor-pointer",
            className
          )}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-gray-900 text-gray-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-900 text-white py-2">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };