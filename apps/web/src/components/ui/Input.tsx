import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import type { ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  accessory?: ReactNode;
  inputAccessory?: ReactNode;
};

export function Input({
  "aria-describedby": ariaDescribedBy,
  accessory,
  id,
  inputAccessory,
  label,
  hint,
  className = "",
  type = "text",
  ...props
}: InputProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "-");
  const inputId = id ?? `input-${reactId}`;
  const hintId = `input-hint-${reactId}`;

  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <span className={accessory ? "field-input-row" : undefined}>
        <span className={inputAccessory ? "field-input-control field-input-control-with-accessory" : "field-input-control"}>
          <input id={inputId} aria-describedby={hint ? hintId : ariaDescribedBy} className="field-input" type={type} {...props} />
          {inputAccessory}
        </span>
        {accessory}
      </span>
      {hint ? (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
