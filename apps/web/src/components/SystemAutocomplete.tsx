import { Search, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useId, useState } from "react";

import { fetchSystems } from "../lib/api";
import type { SolarSystem } from "../types";

type SystemAutocompleteProps = {
  label: string;
  onChange: (system: SolarSystem | null) => void;
  placeholder: string;
  value: SolarSystem | null;
};

export function SystemAutocomplete({ label, onChange, placeholder, value }: SystemAutocompleteProps) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<SolarSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (value && trimmed === value.name) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      fetchSystems(trimmed)
        .then((systems) => {
          if (!cancelled) {
            setResults(systems);
            setOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, value]);

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    setOpen(true);
    if (value && nextQuery !== value.name) {
      onChange(null);
    }
  };

  const selectSystem = (system: SolarSystem) => {
    onChange(system);
    setQuery(system.name);
    setResults([]);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="system-combobox field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="combobox-shell">
        <Search aria-hidden="true" className="combobox-icon" size={17} />
        <input
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && results.length > 0}
          autoComplete="off"
          className="field-input combobox-input"
          id={inputId}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setOpen(results.length > 0)}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        {query ? (
          <button aria-label={`Clear ${label}`} className="combobox-clear" onClick={clear} type="button">
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && (results.length > 0 || loading) ? (
        <div className="combobox-menu" id={listId} role="listbox">
          {loading ? <div className="combobox-state">Scanning systems</div> : null}
          {results.map((system) => (
            <button
              className="combobox-option"
              key={system.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSystem(system)}
              role="option"
              style={{ "--option-accent": system.color } as CSSProperties}
              type="button"
            >
              <span>
                <strong>{system.name}</strong>
                <small>{system.regionName}</small>
              </span>
              <span className="combobox-option-meta">
                <em>{system.serviceType}</em>
                <b>{system.securityDisplay}</b>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
