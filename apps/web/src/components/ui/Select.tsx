import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { label: string; value: string }[];
};

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <select className="field-input" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
