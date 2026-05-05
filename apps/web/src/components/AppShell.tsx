import { RadioTower } from "lucide-react";
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
    <div className="app-shell">
      <header className="topbar">
        <a aria-label="Solane Run calculator" className="brand" href="/">
          <img alt="" src="/assets/logo-detoure.png" />
          <span>
            <strong>SOLANE RUN</strong>
            <small>Freight calculator</small>
          </span>
        </a>

        <div className="topbar-status" aria-label="Service status" role="group">
          <StatusBadge tone="green">PUBLIC</StatusBadge>
          <div className={`signal ${healthy ? "signal-online" : "signal-offline"}`}>
            <a
              aria-label="Open EVE Online server status"
              className="signal-status-link"
              href="https://status.eveonline.com/"
              rel="noreferrer"
              target="_blank"
            >
              <RadioTower size={16} />
            </a>
            <span>
              <strong>Tranquility</strong>
              <small>
                {status ? `${status.players.toLocaleString("en-US")} pilots` : "syncing"}
                {eveTime ? ` - ${eveTime} EVE` : ""}
              </small>
            </span>
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
  const previousHealthyRef = useRef<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const nextStatus = await fetchEsiStatus();
        if (!mounted) {
          return;
        }
        const nextHealthy = !nextStatus.vip;
        const wasHealthy = previousHealthyRef.current;
        previousHealthyRef.current = nextHealthy;
        setStatus(nextStatus);
        setHealthy(nextHealthy);
        if (nextHealthy && wasHealthy === false) {
          window.dispatchEvent(new CustomEvent("solane:esi-restored", { detail: nextStatus }));
        }
      } catch {
        if (!mounted) {
          return;
        }
        previousHealthyRef.current = false;
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
