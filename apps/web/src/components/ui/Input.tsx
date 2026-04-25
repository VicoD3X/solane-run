import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, className = "", ...props }: InputProps) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <input className="field-input" {...props} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
