type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="segmented">
      <legend>{label}</legend>
      <div className="segmented-track">
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className="segmented-option"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
