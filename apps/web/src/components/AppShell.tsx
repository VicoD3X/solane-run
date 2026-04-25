import { Activity, Bookmark, Calculator, RadioTower, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { fetchEsiStatus, type EsiStatus } from "../lib/api";
import { StatusBadge } from "./ui/StatusBadge";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { status, healthy, eveTime } = useTranquilityStatus();

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
          <ComingSoonAction icon={<Settings size={17} />} label="Settings" />
        </nav>

        <div className="topbar-status">
          <StatusBadge>BETA</StatusBadge>
          <div className={`signal ${healthy ? "signal-online" : "signal-offline"}`}>
            <RadioTower size={16} />
            <div>
              <strong>Tranquility</strong>
              <span>
                {status ? `${status.players.toLocaleString("en-US")} pilots` : "syncing"}
                {eveTime ? ` - ${eveTime} EVE` : ""}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function useTranquilityStatus() {
  const [status, setStatus] = useState<EsiStatus | null>(null);
  const [healthy, setHealthy] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const nextStatus = await fetchEsiStatus();
        if (!mounted) {
          return;
        }
        setStatus(nextStatus);
        setHealthy(!nextStatus.vip);
      } catch {
        if (!mounted) {
          return;
        }
        setHealthy(false);
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 30_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return {
    status,
    healthy,
    eveTime: status
      ? new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        })
      : "",
  };
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
