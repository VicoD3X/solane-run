type StatusBadgeProps = {
  tone?: "blue" | "amber" | "green";
  children: string;
};

export function StatusBadge({ children, tone = "blue" }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
