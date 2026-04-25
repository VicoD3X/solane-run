import { Activity, Bookmark, Calculator, History, RadioTower, Settings, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { StatusBadge } from "./ui/StatusBadge";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell min-h-screen">
      <header className="topbar">
        <a aria-label="Solane Run dashboard" className="brand" href="/">
          <img alt="" src="/assets/logo-detoure.png" />
          <div>
            <strong>SOLANE RUN</strong>
            <span>Premium freight desk</span>
          </div>
        </a>

        <nav aria-label="Primary navigation" className="topnav">
          <a className="nav-action" href="#calculator">
            <Calculator size={17} />
            Calculator
          </a>
          <a className="nav-action" href="#route">
            <Activity size={17} />
            Route Intel
          </a>
          <ComingSoonAction icon={<Bookmark size={17} />} label="Saved Quotes" />
          <ComingSoonAction icon={<History size={17} />} label="History" />
          <ComingSoonAction icon={<Settings size={17} />} label="Settings" />
        </nav>

        <div className="topbar-status">
          <StatusBadge tone="green">Public ESI Route</StatusBadge>
          <span className="signal">
            <RadioTower size={16} />
            Tranquility
          </span>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer-strip">
        <span>
          <ShieldCheck size={16} />
          Public-only ESI scope
        </span>
        <span>
          <Activity size={16} />
          Demo pricing model
        </span>
      </footer>
    </div>
  );
}

function ComingSoonAction({ icon, label }: { icon: ReactNode; label: string }) {
  const [display, setDisplay] = useState(label);
  const [active, setActive] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const revealComingSoon = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setActive(true);
    setDisplay("");

    const text = "Coming soon";
    [...text].forEach((_, index) => {
      timers.current.push(
        window.setTimeout(() => {
          setDisplay(text.slice(0, index + 1));
        }, 34 * (index + 1)),
      );
    });

    timers.current.push(
      window.setTimeout(() => {
        setActive(false);
        setDisplay(label);
      }, 1900),
    );
  };

  return (
    <button
      aria-label={`${label}: coming soon`}
      className={`nav-action nav-button ${active ? "typing" : ""}`}
      onClick={revealComingSoon}
      type="button"
    >
      {icon}
      <span>{display || " "}</span>
    </button>
  );
}
