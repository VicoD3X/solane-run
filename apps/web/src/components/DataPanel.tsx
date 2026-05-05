import type { ReactNode } from "react";

type DataPanelProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export function DataPanel({ title, eyebrow, children, className = "" }: DataPanelProps) {
  return (
    <section className={`data-panel ${className}`}>
      <div className="panel-heading">
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
